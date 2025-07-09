
const fs = require('fs');
const xlsx = require('xlsx');
const nodemailer = require('nodemailer');
const path = require('path');
const axios = require('axios');

const supabase = require('../config/supabase_client');

// Elastic Email API configuration
const ELASTIC_EMAIL_API_KEY = process.env.ELASTIC_EMAIL_API_KEY;
const ELASTIC_EMAIL_API_URL = 'https://api.elasticemail.com/v2';

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

// Create nodemailer transporter with Elastic Email SMTP configuration
function createTransporter({ delayBetweenEmails }) {
    return nodemailer.createTransport({
        host: 'smtp.elasticemail.com',
        port: 2525, // or 25, 587, 465
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.ELASTIC_EMAIL_USERNAME, // Your Elastic Email username
            pass: process.env.ELASTIC_EMAIL_API_KEY   // Your Elastic Email API key
            // pass: process.env.EMAIL_PASS   // Your Elastic Email API key

        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: delayBetweenEmails,
        rateLimit: 5,
        connectionTimeout: 15000,
        socketTimeout: 45000
    });
}

// Alternative: Send email directly via Elastic Email API
async function sendEmailViaAPI(emailData) {
    try {
        const formData = new FormData();
        formData.append('apikey', ELASTIC_EMAIL_API_KEY);
        formData.append('from', emailData.from);
        formData.append('to', emailData.to);
        formData.append('subject', emailData.subject);
        formData.append('bodyHtml', emailData.html);
        
        // Add tracking parameters
        formData.append('trackClicks', 'true');
        formData.append('trackOpens', 'true');
        
        // Add campaign name for tracking
        if (emailData.campaignId) {
            formData.append('channel', `campaign_${emailData.campaignId}`);
        }

        const response = await axios.post(`${ELASTIC_EMAIL_API_URL}/email/send`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return {
            success: response.data.success,
            // messageId: response.data.data.messageid,
            // transactionId: response.data.data.transactionid
        };
    } catch (error) {
        console.error('Elastic Email API Error:', error.response?.data || error.message);
        throw error;
    }
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
            if (fs.existsExists(directPath)) {
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

// Send emails with retry and personalization using Elastic Email
async function sendEmailsJob({
    jobId,
    recipients,
    emailColumn,
    nameColumn,
    subjectLine,
    senderName,
    emailUser,
    templateContent,
    variables,
    transporter,
    delayBetweenEmails,
    activeSendingJobs,
    uploadsPath = './uploads/images/',
    campaignId,
    useAPI = true // Option to use API instead of SMTP
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

            let retries = 2;
            let sent = false;
            let messageId = null;

            while (retries >= 0 && !sent) {
                try {
                    if (useAPI) {
                        // Use Elastic Email API
                        const result = await sendEmailViaAPI({
                            from: emailUser, 
                            to: email,
                            subject: personalizedSubject,
                            html: personalized,
                            campaignId: campaignId
                        });
                        
                        if (result.success) {
                            messageId = result.messageId;
                            sent = true;
                        } else {
                            throw new Error('API send failed');
                        }
                    } else {
                        // Use SMTP
                        const mailOptions = {
                            from: emailUser ,
                            to: email,
                            subject: personalizedSubject,
                            html: personalized,
                            attachments: baseAttachments,
                            headers: {
                                'X-Campaign-ID': campaignId,
                                'X-Recipient-Email': email
                            }
                        };

                        const result = await transporter.sendMail(mailOptions);
                        messageId = result.messageId;
                        sent = true;
                    }

                    success++;
                    const jobData = activeSendingJobs.get(jobId);
                    if (jobData) jobData.sentEmails = success;


                    

                    // Optional: Store minimal campaign metadata if needed
                    // No need to store individual email tracking - use Elastic Email API for analytics
                } catch (err) {
                    // retries--;
                    // if (retries < 0) throw err;
                    // await new Promise(r => setTimeout(r, 1000));
                    const isRateLimit = err.response?.status === 429;
                    const retryAfter = parseInt(err.response?.headers?.['retry-after']) || 5;

                    console.warn(`Retrying email to ${email}. Retries left: ${retries}, Reason: ${err.message}`);

                    retries--;
                    if (retries < 0) {
                        throw err;
                    }

                    // Backoff: if 429, use Retry-After header
                    await new Promise(r =>
                        setTimeout(r, isRateLimit ? retryAfter * 1000 : (3 - retries) * 2000)
                    );
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
    
    if (transporter && typeof transporter.close === 'function') {
        transporter.close();
    }
}

// Optional: Store minimal campaign info locally (just campaign metadata, not tracking data)
async function storeCampaignMetadata(campaignId, campaignName, metadata) {
    try {
        const campaignData = {
            campaign_id: campaignId,
            campaign_name: campaignName,
            created_at: new Date().toISOString(),
            ...metadata
        };

        const { data, error } = await supabase
            .from('campaigns')
            .upsert([campaignData])
            .select();

        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }

        return {
            success: true,
            data: data[0],
            message: 'Campaign metadata stored successfully'
        };
    } catch (error) {
        console.error('Error storing campaign metadata:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Get specific campaign analytics from Elastic Email
async function getSpecificCampaignAnalytics(campaignName, startDate, endDate) {
    try {
        const params = new URLSearchParams({
            apikey: process.env.ELASTIC_EMAIL_API_KEY,
            from: startDate.toISOString().split('T')[0],
            to: endDate.toISOString().split('T')[0],
            channel: `campaign_${campaignName}`
        });

        const response = await axios.get(`${ELASTIC_EMAIL_API_URL}/log/summary?${params}`);
        
        if (response.data.success) {
            const data = response.data.data;
            
            // Calculate additional metrics
            const deliveryRate = data.sent > 0 ? ((data.delivered / data.sent) * 100).toFixed(2) : 0;
            const openRate = data.delivered > 0 ? ((data.opened / data.delivered) * 100).toFixed(2) : 0;
            const clickRate = data.delivered > 0 ? ((data.clicked / data.delivered) * 100).toFixed(2) : 0;
            const bounceRate = data.sent > 0 ? ((data.bounced / data.sent) * 100).toFixed(2) : 0;
            const unsubscribeRate = data.delivered > 0 ? ((data.unsubscribed / data.delivered) * 100).toFixed(2) : 0;

            return {
                success: true,
                campaign: campaignName,
                period: {
                    from: startDate.toISOString().split('T')[0],
                    to: endDate.toISOString().split('T')[0]
                },
                metrics: {
                    // Raw numbers
                    sent: data.sent || 0,
                    delivered: data.delivered || 0,
                    opened: data.opened || 0,
                    clicked: data.clicked || 0,
                    bounced: data.bounced || 0,
                    unsubscribed: data.unsubscribed || 0,
                    complaints: data.complaints || 0,
                    
                    // Calculated rates
                    deliveryRate: parseFloat(deliveryRate),
                    openRate: parseFloat(openRate),
                    clickRate: parseFloat(clickRate),
                    bounceRate: parseFloat(bounceRate),
                    unsubscribeRate: parseFloat(unsubscribeRate),
                    
                    // Click-to-open rate
                    clickToOpenRate: data.opened > 0 ? parseFloat(((data.clicked / data.opened) * 100).toFixed(2)) : 0
                },
                // Performance indicators
                performance: {
                    status: getPerformanceStatus(parseFloat(deliveryRate), parseFloat(openRate), parseFloat(clickRate)),
                    recommendations: getPerformanceRecommendations(parseFloat(deliveryRate), parseFloat(openRate), parseFloat(clickRate), parseFloat(bounceRate))
                }
            };
        } else {
            throw new Error('Failed to fetch campaign analytics from Elastic Email');
        }
    } catch (error) {
        console.error('Error getting specific campaign analytics:', error);
        return {
            success: false,
            error: error.message,
            campaign: campaignName
        };
    }
}

// Get overall account analytics from Elastic Email
async function getOverallAnalytics(startDate, endDate, includeChannels = false) {
    try {
        const params = new URLSearchParams({
            apikey: ELASTIC_EMAIL_API_KEY,
            from: startDate.toISOString().split('T')[0],
            to: endDate.toISOString().split('T')[0]
        });

        const response = await axios.get(`${ELASTIC_EMAIL_API_URL}/log/summary?${params}`);
        
        if (response.data.success) {
            const data = response.data.data;
            
            // Calculate overall metrics
            const deliveryRate = data.sent > 0 ? ((data.delivered / data.sent) * 100).toFixed(2) : 0;
            const openRate = data.delivered > 0 ? ((data.opened / data.delivered) * 100).toFixed(2) : 0;
            const clickRate = data.delivered > 0 ? ((data.clicked / data.delivered) * 100).toFixed(2) : 0;
            const bounceRate = data.sent > 0 ? ((data.bounced / data.sent) * 100).toFixed(2) : 0;

            const analytics = {
                success: true,
                period: {
                    from: startDate.toISOString().split('T')[0],
                    to: endDate.toISOString().split('T')[0]
                },
                overall: {
                    // Raw numbers
                    sent: data.sent || 0,
                    delivered: data.delivered || 0,
                    opened: data.opened || 0,
                    clicked: data.clicked || 0,
                    bounced: data.bounced || 0,
                    unsubscribed: data.unsubscribed || 0,
                    complaints: data.complaints || 0,
                    
                    // Calculated rates
                    deliveryRate: parseFloat(deliveryRate),
                    openRate: parseFloat(openRate),
                    clickRate: parseFloat(clickRate),
                    bounceRate: parseFloat(bounceRate),
                    unsubscribeRate: data.delivered > 0 ? parseFloat(((data.unsubscribed / data.delivered) * 100).toFixed(2)) : 0,
                    complaintRate: data.delivered > 0 ? parseFloat(((data.complaints / data.delivered) * 100).toFixed(2)) : 0,
                    
                    // Advanced metrics
                    clickToOpenRate: data.opened > 0 ? parseFloat(((data.clicked / data.opened) * 100).toFixed(2)) : 0,
                    engagementRate: data.delivered > 0 ? parseFloat((((data.opened + data.clicked) / data.delivered) * 100).toFixed(2)) : 0
                },
                // Account health indicators
                accountHealth: {
                    status: getAccountHealthStatus(parseFloat(deliveryRate), parseFloat(bounceRate), data.complaints, data.delivered),
                    reputationScore: calculateReputationScore(parseFloat(deliveryRate), parseFloat(bounceRate), data.complaints, data.delivered),
                    recommendations: getAccountRecommendations(parseFloat(deliveryRate), parseFloat(bounceRate), data.complaints, data.delivered)
                }
            };

            // Optionally include channel breakdown
            if (includeChannels) {
                analytics.channels = await getChannelBreakdown(startDate, endDate);
            }

            return analytics;
        } else {
            throw new Error('Failed to fetch overall analytics from Elastic Email');
        }
    } catch (error) {
        console.error('Error getting overall analytics:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Get breakdown by channels (campaigns)
async function getChannelBreakdown(startDate, endDate) {
    try {
        const logs = await getEmailLogs(null, startDate, endDate, 10000);
        
        const channelStats = {};
        
        logs.forEach(log => {
            const channel = log.channel || 'default';
            
            if (!channelStats[channel]) {
                channelStats[channel] = {
                    sent: 0,
                    delivered: 0,
                    opened: 0,
                    clicked: 0,
                    bounced: 0,
                    unsubscribed: 0,
                    complaints: 0
                };
            }
            
            // Count based on status
            switch (log.status.toLowerCase()) {
                case 'sent':
                    channelStats[channel].sent++;
                    break;
                case 'delivered':
                    channelStats[channel].delivered++;
                    break;
                case 'opened':
                    channelStats[channel].opened++;
                    break;
                case 'clicked':
                    channelStats[channel].clicked++;
                    break;
                case 'bounced':
                    channelStats[channel].bounced++;
                    break;
                case 'unsubscribed':
                    channelStats[channel].unsubscribed++;
                    break;
                case 'abuse':
                    channelStats[channel].complaints++;
                    break;
            }
        });
        
        // Calculate rates for each channel
        Object.keys(channelStats).forEach(channel => {
            const stats = channelStats[channel];
            stats.deliveryRate = stats.sent > 0 ? parseFloat(((stats.delivered / stats.sent) * 100).toFixed(2)) : 0;
            stats.openRate = stats.delivered > 0 ? parseFloat(((stats.opened / stats.delivered) * 100).toFixed(2)) : 0;
            stats.clickRate = stats.delivered > 0 ? parseFloat(((stats.clicked / stats.delivered) * 100).toFixed(2)) : 0;
            stats.bounceRate = stats.sent > 0 ? parseFloat(((stats.bounced / stats.sent) * 100).toFixed(2)) : 0;
        });
        
        return channelStats;
    } catch (error) {
        console.error('Error getting channel breakdown:', error);
        return {};
    }
}

// Helper function to determine performance status
function getPerformanceStatus(deliveryRate, openRate, clickRate) {
    if (deliveryRate >= 95 && openRate >= 20 && clickRate >= 2) {
        return 'Excellent';
    } else if (deliveryRate >= 90 && openRate >= 15 && clickRate >= 1.5) {
        return 'Good';
    } else if (deliveryRate >= 85 && openRate >= 10 && clickRate >= 1) {
        return 'Average';
    } else {
        return 'Needs Improvement';
    }
}

// Helper function to get performance recommendations
function getPerformanceRecommendations(deliveryRate, openRate, clickRate, bounceRate) {
    const recommendations = [];
    
    if (deliveryRate < 95) {
        recommendations.push('Improve list hygiene to increase delivery rate');
    }
    if (bounceRate > 5) {
        recommendations.push('Clean your email list to reduce bounce rate');
    }
    if (openRate < 20) {
        recommendations.push('Optimize subject lines to improve open rates');
    }
    if (clickRate < 2) {
        recommendations.push('Improve email content and CTAs to increase click rates');
    }
    if (recommendations.length === 0) {
        recommendations.push('Great performance! Keep up the good work');
    }
    
    return recommendations;
}

// Helper function to calculate account health status
function getAccountHealthStatus(deliveryRate, bounceRate, complaints, delivered) {
    const complaintRate = delivered > 0 ? (complaints / delivered) * 100 : 0;
    
    if (deliveryRate >= 95 && bounceRate <= 2 && complaintRate <= 0.1) {
        return 'Excellent';
    } else if (deliveryRate >= 90 && bounceRate <= 5 && complaintRate <= 0.3) {
        return 'Good';
    } else if (deliveryRate >= 80 && bounceRate <= 10 && complaintRate <= 0.5) {
        return 'Fair';
    } else {
        return 'Poor';
    }
}

// Helper function to calculate reputation score
function calculateReputationScore(deliveryRate, bounceRate, complaints, delivered) {
    const complaintRate = delivered > 0 ? (complaints / delivered) * 100 : 0;
    
    let score = 100;
    score -= (100 - deliveryRate) * 0.5; // Delivery rate impact
    score -= bounceRate * 2; // Bounce rate impact
    score -= complaintRate * 10; // Complaint rate impact
    
    return Math.max(0, Math.min(100, Math.round(score)));
}

// Helper function to get account recommendations
function getAccountRecommendations(deliveryRate, bounceRate, complaints, delivered) {
    const recommendations = [];
    const complaintRate = delivered > 0 ? (complaints / delivered) * 100 : 0;
    
    if (deliveryRate < 90) {
        recommendations.push('Critical: Improve sender reputation and list quality');
    }
    if (bounceRate > 5) {
        recommendations.push('High bounce rate detected - implement list validation');
    }
    if (complaintRate > 0.3) {
        recommendations.push('High complaint rate - review content and consent practices');
    }
    if (deliveryRate >= 95 && bounceRate <= 2 && complaintRate <= 0.1) {
        recommendations.push('Excellent sender reputation - maintain current practices');
    }
    
    return recommendations;
}

// Get detailed email logs from Elastic Email
async function getEmailLogs(campaignName, startDate, endDate, limit = 1000) {
    try {
        const params = new URLSearchParams({
            apikey: ELASTIC_EMAIL_API_KEY,
            from: startDate.toISOString().split('T')[0],
            to: endDate.toISOString().split('T')[0],
            limit: limit.toString()
        });

        if (campaignName) {
            params.append('channel', `campaign_${campaignName}`);
        }

        const response = await axios.get(`${ELASTIC_EMAIL_API_URL}/log/load?${params}`);
        
        if (response.data.success) {
            return response.data.data;
        } else {
            throw new Error('Failed to fetch email logs from Elastic Email');
        }
    } catch (error) {
        console.error('Error getting email logs:', error);
        throw error;
    }
}

// Sync email tracking data from Elastic Email to local database
async function syncTrackingData(campaignId, campaignName, startDate, endDate) {
    try {
        const logs = await getEmailLogs(campaignName, startDate, endDate);
        
        for (const log of logs) {
            const trackingUpdate = {
                updated_at: new Date().toISOString()
            };

            // Map Elastic Email statuses to our tracking system
            switch (log.status.toLowerCase()) {
                case 'sent':
                    trackingUpdate.status = 'sent';
                    break;
                case 'delivered':
                    trackingUpdate.status = 'delivered';
                    break;
                case 'opened':
                    trackingUpdate.opened = true;
                    trackingUpdate.opened_at = new Date(log.date).toISOString();
                    break;
                case 'clicked':
                    trackingUpdate.clicked = true;
                    trackingUpdate.clicked_at = new Date(log.date).toISOString();
                    break;
                case 'bounced':
                    trackingUpdate.status = 'bounced';
                    trackingUpdate.bounce_reason = log.category;
                    break;
                case 'unsubscribed':
                    trackingUpdate.unsubscribed = true;
                    trackingUpdate.unsubscribed_at = new Date(log.date).toISOString();
                    break;
            }

            // Update the tracking record
            await supabase
                .from('email_tracking')
                .update(trackingUpdate)
                .eq('campaign_id', campaignId)
                .eq('recipient_email', log.to);
        }

        return { success: true, message: 'Tracking data synced successfully' };
    } catch (error) {
        console.error('Error syncing tracking data:', error);
        return { success: false, error: error.message };
    }
}

// Get real-time analytics dashboard data
async function getDashboardAnalytics(period = 'last7days') {
    try {
        const { startDate, endDate } = getPeriodDates(period);
        
        // Get overall analytics
        const overallAnalytics = await getOverallAnalytics(startDate, endDate, true);
        
        if (!overallAnalytics.success) {
            throw new Error(overallAnalytics.error);
        }
        
        // Get top performing campaigns
        const topCampaigns = await getTopPerformingCampaigns(startDate, endDate, 5);
        
        // Get recent activity
        const recentActivity = await getEmailLogs(null, startDate, endDate, 50);
        
        return {
            success: true,
            period: period,
            dateRange: {
                from: startDate.toISOString().split('T')[0],
                to: endDate.toISOString().split('T')[0]
            },
            overview: overallAnalytics.overall,
            accountHealth: overallAnalytics.accountHealth,
            topCampaigns: topCampaigns,
            recentActivity: recentActivity.slice(0, 10), // Latest 10 activities
            channelBreakdown: overallAnalytics.channels || {}
        };
    } catch (error) {
        console.error('Error getting dashboard analytics:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Get top performing campaigns
async function getTopPerformingCampaigns(startDate, endDate, limit = 5) {
    try {
        const channels = await getChannelBreakdown(startDate, endDate);
        
        // Sort by engagement rate (open rate + click rate)
        const sortedCampaigns = Object.entries(channels)
            .map(([name, stats]) => ({
                name: name.replace('campaign_', ''),
                ...stats,
                engagementRate: stats.openRate + stats.clickRate
            }))
            .sort((a, b) => b.engagementRate - a.engagementRate)
            .slice(0, limit);
            
        return sortedCampaigns;
    } catch (error) {
        console.error('Error getting top performing campaigns:', error);
        return [];
    }
}

// Helper function to get date ranges for different periods
function getPeriodDates(period) {
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
        case 'today':
            startDate = new Date();
            break;
        case 'yesterday':
            startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            endDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            break;
        case 'last7days':
            startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'last30days':
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            break;
        case 'last90days':
            startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            break;
        case 'thismonth':
            startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
            break;
        case 'lastmonth':
            startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
            endDate = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
            break;
        default:
            startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }
    
    return { startDate, endDate };
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

// Validate Elastic Email configuration
function validateElasticEmailConfig() {
    if (!ELASTIC_EMAIL_API_KEY) {
        throw new Error('ELASTIC_EMAIL_API_KEY environment variable is required');
    }
    
    if (!process.env.ELASTIC_EMAIL_USERNAME) {
        throw new Error('ELASTIC_EMAIL_USERNAME environment variable is required');
    }
    
    return true;
}

module.exports = {
    readExcelData,
    getTemplateContent,
    filterValidRecipients,
    createTransporter,
    sendEmailsJob,
    sendEmailViaAPI,
    extractCIDReferences,
    buildAttachmentsFromCIDs,
    
    // Analytics Functions
    getSpecificCampaignAnalytics,
    getOverallAnalytics,
    getDashboardAnalytics,
    getChannelBreakdown,
    getTopPerformingCampaigns,
    getEmailLogs,
    
    // Optional local storage
    storeCampaignMetadata,
    syncTrackingData,
    
    // Utility Functions
    logError,
    validateEmailConfig,
    validateElasticEmailConfig,
    getPeriodDates
};