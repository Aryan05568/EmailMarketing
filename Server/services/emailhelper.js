


const fs = require('fs');
const xlsx = require('xlsx');
const nodemailer = require('nodemailer');
const path = require('path');

// AWS SDK v3 imports
const { SESClient, CreateConfigurationSetCommand, CreateConfigurationSetEventDestinationCommand } = require('@aws-sdk/client-ses');
const { CloudWatchClient, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');
const supabase = require('../config/supabase_client');

// Configure AWS SDK v3 clients
const sesClient = new SESClient({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY 
    }
});

const cloudWatchClient = new CloudWatchClient({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Read Excel file and return data
function readExcelData(excelPath) {
    console.log(excelPath)
    if (!fs.existsSync(excelPath)) throw new Error('Excel file not found');
    const workbook = xlsx.readFile(excelPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return xlsx.utils.sheet_to_json(sheet);
}

// Get the email template content either from pasted template or HTML file
function getTemplateContent(template, htmlPath) {
    if (template) return template;
    if (htmlPath && fs.existsSync(htmlPath)) return fs.readFileSync(htmlPath, 'utf8');
    throw new Error('Template not found');
}

// Filter valid emails from data based on email column
function filterValidRecipients(data, emailColumn) {
    return data.filter(row => {
        const email = row[emailColumn];
        return email && typeof email === 'string' && email.includes('@') && email.includes('.');
    });
}

// Create SES Configuration Set for tracking (AWS SDK v3)
async function createConfigurationSet(configSetName) {
    try {
        const createConfigSetCommand = new CreateConfigurationSetCommand({
            ConfigurationSet: {
                Name: configSetName
            }
        });

        await sesClient.send(createConfigSetCommand);
        console.log(`Configuration set ${configSetName} created successfully`);

        // Add event destinations for tracking
        await addEventDestinations(configSetName);

    } catch (error) {
        if (error.name === 'AlreadyExistsException') {
            console.log(`Configuration set ${configSetName} already exists`);
        } else {
            console.error('Error creating configuration set:', error);
            throw error;
        }
    }
}

// Add event destinations for tracking delivery, bounces, complaints, opens (AWS SDK v3)
async function addEventDestinations(configSetName) {
    const eventTypes = ['send', 'reject', 'bounce', 'complaint', 'delivery', 'open', 'click'];

    try {
        // CloudWatch destination for metrics
        const destinationName = `${configSetName}-cw`.substring(0, 64);
        const eventDestinationCommand = new CreateConfigurationSetEventDestinationCommand({
            ConfigurationSetName: configSetName,
            EventDestination: {
                Name: destinationName,
                Enabled: true,
                MatchingEventTypes: eventTypes,
                CloudWatchDestination: {
                    DimensionConfigurations: [
                        {
                            DimensionName: 'MessageTag',
                            DimensionValueSource: 'messageTag',
                            DefaultDimensionValue: 'default'
                        },
                        {
                            DimensionName: 'EmailAddress',
                            DimensionValueSource: 'emailHeader',
                            DefaultDimensionValue: 'unknown'
                        }
                    ]
                }
            }
        });

        await sesClient.send(eventDestinationCommand);
        console.log(`CloudWatch event destination added to ${configSetName}`);

    } catch (error) {
        if (error.name === 'AlreadyExistsException') {
            console.log(`Event destination already exists for ${configSetName}`);
        } else {
            console.error('Error adding event destination:', error);
        }
    }
}

// Create nodemailer transporter with SES configuration
function createTransporter({ delayBetweenEmails, configurationSet }) {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST ,
        port: 2525,
        secure: false, // Use STARTTLS
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS 
        },
        pool: true,
        maxConnections: 3,
        maxMessages: 50,
        rateDelta: delayBetweenEmails,
        rateLimit: 3,
        connectionTimeout: 15000,
        socketTimeout: 45000,
        // Add SES specific headers for tracking
        headers: configurationSet ? {
            'X-SES-CONFIGURATION-SET': configurationSet
        } : {}
    });
}

// Extract CID references from HTML template
function extractCIDReferences(htmlContent) {
    const cidPattern = /src=["']cid:([^"']+)["']/gi;
    const cids = [];
    let match;

    while ((match = cidPattern.exec(htmlContent)) !== null) {
        cids.push(match[1]); // Extract the CID name
    }

    return [...new Set(cids)]; // Remove duplicates
}

// Build attachments array from CID references
function buildAttachmentsFromCIDs(cids, uploadsPath = './uploads/images/') {
    const attachments = [];

    cids.forEach(cid => {
        // Try different common image extensions
        const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        let foundFile = null;

        for (const ext of extensions) {
            const possiblePath = path.join(uploadsPath, cid + ext);
            if (fs.existsSync(possiblePath)) {
                foundFile = possiblePath;
                break;
            }

            // Also try without extension (in case CID already includes it)
            const directPath = path.join(uploadsPath, cid);
            if (fs.existsSync(directPath)) {
                foundFile = directPath;
                break;
            }
        }

        if (foundFile) {
            attachments.push({
                filename: path.basename(foundFile),
                path: foundFile,
                cid: cid
            });
        } else {
            console.warn(`Image not found for CID: ${cid}`);
        }
    });

    return attachments;
}

// Add tracking pixel for open tracking
function addTrackingPixel(htmlContent, campaignId, recipientEmail) {
    const trackingPixel = `<img src="https://your-domain.com/api/track/open/${campaignId}?email=${encodeURIComponent(recipientEmail)}" width="1" height="1" style="display:none;" />`;

    // Insert before closing body tag or at the end
    if (htmlContent.includes('</body>')) {
        return htmlContent.replace('</body>', `${trackingPixel}</body>`);
    } else {
        return htmlContent + trackingPixel;
    }
}

// Send emails with retry and personalization
async function sendEmailsJob({
    jobId,
    recipients,
    emailColumn,
    nameColumn,
    subjectLine,
    senderName,
    templateContent,
    variables,
    transporter,
    delayBetweenEmails,
    activeSendingJobs,
    uploadsPath = './uploads/images/',
    campaignId,
    configurationSet,

}) {
    let success = 0;
    let failed = 0;

    // Extract CID references from template once
    const cidReferences = extractCIDReferences(templateContent);
    const baseAttachments = buildAttachmentsFromCIDs(cidReferences, uploadsPath);

    for (let i = 0; i < recipients.length; i++) {
        const currentJobData = activeSendingJobs.get(jobId);
        if (!currentJobData || currentJobData.shouldStop) {
            if (currentJobData) {
                currentJobData.sentEmails = success;
                currentJobData.failedEmails = failed;
                currentJobData.stopped = true;
            }
            break;
        }

        const row = recipients[i];
        const email = row[emailColumn];
        const name = nameColumn ? row[nameColumn] || '' : '';

        try {
            let personalized = templateContent;
            if (Array.isArray(variables)) {
                variables.forEach(variable => {
                    if (variable.placeholder && variable.column && row[variable.column]) {
                        const value = String(row[variable.column]);
                        const regex = new RegExp(`{{${variable.placeholder}}}`, 'g');
                        personalized = personalized.replace(regex, value);
                    }
                });
            }
            const personalizedSubject = subjectLine.replace(/{{name}}/gi, name);
            personalized = personalized.replace(/{{name}}/gi, name);

            // Add tracking pixel for open tracking
            personalized = addTrackingPixel(personalized, campaignId, email);

            // Prepare email options
            const mailOptions = {
                from: "noreply@marketing.brainaura.in",
                to: email,
                subject: personalizedSubject,
                html: personalized,
                attachments: baseAttachments, // Include CID attachments
                headers: {
                    'X-SES-CONFIGURATION-SET': configurationSet,
                    'X-SES-MESSAGE-TAGS': `campaign=${campaignId},recipient=${email}`,
                    'X-Campaign-ID': campaignId,
                    'X-Recipient-Email': email
                }
            };

            let retries = 2;
            let sent = false;

            while (retries >= 0 && !sent) {
                try {
                    const result = await transporter.sendMail(mailOptions);
                    sent = true;
                    success++;
                    const jobData = activeSendingJobs.get(jobId);
                    if (jobData) jobData.sentEmails = success;

                    // Store message ID in database for tracking
                    // if (result.messageId) {
                    //     const trackingResult = await storeEmailTracking(campaignId, email, result.messageId,);
                    //     if (!trackingResult.success) {
                    //         console.warn(`Tracking failed for ${email}:`, trackingResult.error);
                    //     }
                    // }
                } catch (err) {
                    retries--;
                    if (retries < 0) throw err;
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        } catch (err) {
            failed++;
            console.error(`Failed to send email to ${email}:`, err.message);
            const jobData = activeSendingJobs.get(jobId);
            if (jobData) jobData.failedEmails = failed;
        }

        if (i < recipients.length - 1) {
            await new Promise(r => setTimeout(r, delayBetweenEmails));
        }
    }

    const finalJobData = activeSendingJobs.get(jobId);
    if (finalJobData) {
        finalJobData.completed = true;
        finalJobData.endTime = new Date();
    }
    transporter.close();
}



async function storeEmailTracking(campaignId, recipientEmail, messageId) {
    try {
        if (!campaignId || !recipientEmail || !messageId) {
            throw new Error('Missing required parameters: campaignId, recipientEmail, or messageId');
        }

        const trackingData = {
            campaign_id: campaignId,
            recipient_email: recipientEmail,
            message_id: messageId,
            sent_at: new Date().toISOString(),
            status: 'sent',
            opened: false,
            clicked: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Check if a record already exists (without .single())
        const { data: existingRecords, error: selectError } = await supabase
            .from('email_tracking')
            .select('*')
            .eq('campaign_id', campaignId)
            .eq('recipient_email', recipientEmail);

        if (selectError) {
            throw new Error(`Database select error: ${selectError.message}`);
        }

        if (existingRecords && existingRecords.length > 0) {
            // Record exists, update it
            console.log(`Updating existing tracking record for: ${recipientEmail}`);
            
            const { data, error } = await supabase
                .from('email_tracking')
                .update({
                    message_id: messageId,
                    status: 'sent',
                    updated_at: new Date().toISOString()
                })
                .eq('campaign_id', campaignId)
                .eq('recipient_email', recipientEmail)
                .select();

            if (error) {
                throw new Error(`Database update error: ${error.message}`);
            }

            console.log('Email tracking data updated successfully for:', recipientEmail);
            return {
                success: true,
                data: data[0],
                message: 'Email tracking data updated successfully'
            };

        } else {
            // Record doesn't exist, insert new one
            console.log(`Inserting new tracking record for: ${recipientEmail}`);
            
            const { data, error } = await supabase
                .from('email_tracking')
                .insert([trackingData])
                .select();

            if (error) {
                throw new Error(`Database insert error: ${error.message}`);
            }

            console.log('Email tracking data stored successfully for:', recipientEmail);
            return {
                success: true,
                data: data[0],
                message: 'Email tracking data stored successfully'
            };
        }

    } catch (error) {
        console.error('Error storing email tracking:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to store email tracking data'
        };
    }
}
// Get campaign statistics from CloudWatch (AWS SDK v3)
async function getCampaignStats(configSetName, startDate, endDate) {
    try {
        const metrics = ['Send', 'Delivery', 'Bounce', 'Complaint', 'Open', 'Click'];
        const stats = {};

        for (const metric of metrics) {
            const command = new GetMetricStatisticsCommand({
                Namespace: 'AWS/SES',
                MetricName: metric,
                Dimensions: [
                    {
                        Name: 'ConfigurationSet',
                        Value: configSetName
                    }
                ],
                StartTime: startDate,
                EndTime: endDate,
                Period: 3600, // 1 hour periods
                Statistics: ['Sum']
            });

            const result = await cloudWatchClient.send(command);
            stats[metric] = result.Datapoints.reduce((sum, point) => sum + point.Sum, 0);
        }

        return stats;
    } catch (error) {
        console.error('Error getting campaign stats:', error);
        throw error;
    }
}

// Enhanced error handling and logging
function logError(context, error, additionalInfo = {}) {
    console.error(`[${context}] Error:`, {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...additionalInfo
    });
}

// Validate email configuration
function validateEmailConfig(config) {
    const required = ['emailColumn', 'subjectLine'];
    const missing = required.filter(field => !config[field]);

    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    return true;
}

module.exports = {
    readExcelData,
    getTemplateContent,
    filterValidRecipients,
    createTransporter,
    sendEmailsJob,
    extractCIDReferences,
    buildAttachmentsFromCIDs,
    createConfigurationSet,
    getCampaignStats,
    storeEmailTracking,
    logError,
    validateEmailConfig,
    // Export AWS clients for use in other modules
    sesClient,
    cloudWatchClient
};