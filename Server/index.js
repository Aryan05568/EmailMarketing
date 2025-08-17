const express = require('express');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const xlsx = require('xlsx');
const fs = require('fs');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const supabase = require('./config/supabase_client');
const authRoutes = require('./route/route');
const analyticsRoutes = require("./route/analytics")
const axios = require('axios');
// const fetch = require('node-fetch');
const { previewExcel } = require('./services/excelservice');
const { parseHtmlTemplate } = require('./services/templateservice');
const { testSMTPConnection } = require('./services/smtpservice');
const {
    readExcelData,
    getTemplateContent,
    filterValidRecipients,
    createTransporter,
    sendEmailsJob,
    createConfigurationSet,
    getCampaignStats,
    validateEmailConfig,
    logError
} = require('./services/emailhelper');
const campaignScheduler = require('./services/schedulerservice');


dotenv.config();

const app = express();

app.use(cors({
    origin: true,
    credentials: true,

}));

app.use(express.json()); // parse incoming JSON requests
app.use('/api/auth', authRoutes);
app.use('/api/analytics',analyticsRoutes)

// Enable CORS for React frontend
app.use(cors({
    origin: true,
    credentials: true,

}));

app.use(express.static('public'));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global variable to track active sending processes
const activeSendingJobs = new Map();

// Ensure upload directories exist
const dirs = ['uploads', 'uploads/excel', 'uploads/html','uploads/images'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure storage


campaignScheduler.setActiveSendingJobs(activeSendingJobs);


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let dest;
        if (file.fieldname === 'excel') {
            dest = 'uploads/excel/';
        } else if (file.fieldname === 'template') {
            dest = 'uploads/html/';
        } else if (file.fieldname === 'image') {
            dest = 'uploads/images/';
        } else {
            dest = 'uploads/'; // fallback directory
        }
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ 
    dest: 'temp/', // Temporary folder for processing
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

const uploadFormData = multer({
    storage: multer.memoryStorage(), // No file storage needed since you're sending URLs
    limits: {
        fieldSize: 2 * 1024 * 1024, // 2MB per field
        fields: 50 // Maximum number of fields
    }
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "✅ Email Marketing Server is running!"
  });
});



app.get('/ping', (req, res) => {
    res.send({
        message: 'Welcome to the Email Marketing',
    })
})

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        activeJobs: activeSendingJobs.size
    });
});



app.post('/preview-excel', upload.single('excel'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No Excel file uploaded'
            });
        }

        // Process Excel file first
        const excelData = previewExcel(req.file.path);

        console.log(req.file.path, 'Excel file processed successfully');

        // Upload to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(
            req.file.path, 
            'uploads/excel', 
            'raw' // For Excel files
        );

        // Clean up temporary file
        cleanupTempFile(req.file.path);

        res.json({
            success: true,
            headers: excelData.headers,
            sample: excelData.sample,
            totalRows: excelData.totalRows,
            cloudinaryUrl: cloudinaryResult.secure_url,
            cloudinaryPublicId: cloudinaryResult.public_id,
            originalName: req.file.originalname
        });

    } catch (error) {
        // Clean up temporary file in case of error
        if (req.file) {
            cleanupTempFile(req.file.path);
        }

        console.error('Excel upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error processing Excel file'
        });
    }
});

app.post('/upload-template', upload.single('template'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No template file uploaded'
            });
        }

        // Parse HTML template first (before uploading)
        const template = parseHtmlTemplate(req.file.path);

        // Upload to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(
            req.file.path, 
            'uploads/templates', 
            'raw' // For HTML files
        );

        // Clean up temporary file
        cleanupTempFile(req.file.path);

        res.json({
            success: true,
            cloudinaryUrl: cloudinaryResult.secure_url,
            cloudinaryPublicId: cloudinaryResult.public_id,
            template: template,
            originalName: req.file.originalname
        });

    } catch (error) {
        // Clean up temporary file in case of error
        if (req.file) {
            cleanupTempFile(req.file.path);
        }

        console.error('Template upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error processing HTML template'
        });
    }
});


// app.post('/preview-excel', upload.single('excel'), (req, res) => {
//     //neww
//     try {

//         if (!req.file) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'No Excel file uploaded'
//             });
//         }

//         const excelPath = req.file.path;
//         const result = previewExcel(excelPath);

//         res.json({
//             success: true,
//             headers: result.headers,
//             sample: result.sample,
//             totalRows: result.totalRows,
//             filePath: excelPath
//         });
//     } catch (err) {
//         console.error('Error processing Excel file:', err);
//         res.status(500).json({
//             success: false,
//             message: err.message || 'Error processing Excel file'
//         });
//     }
// });



// Test SMTP connection endpoint








// Stop sending endpoint



app.post('/test-connection', async(req, res) => {
    try {
        await testSMTPConnection(req.body);

        res.json({
            success: true,
            message: 'SMTP connection successful!'
        });
    } catch (err) {
        console.error('SMTP connection failed:', err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
});


app.post('/stop-sending', (req, res) => {
    const { jobId } = req.body;

    if (!jobId) {
        return res.status(400).json({
            success: false,
            message: 'Job ID is required'
        });
    }

    if (activeSendingJobs.has(jobId)) {
        // Set the shouldStop flag to true
        const jobData = activeSendingJobs.get(jobId);
        jobData.shouldStop = true;

        res.json({
            success: true,
            message: 'Stop signal sent. Email sending will stop after the current email completes.'
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'Job not found or already completed'
        });
    }
});




app.post('/send', async(req, res) => {
    const {
        excelPath,
        htmlPath,
        emailColumn,
        nameColumn,
        subjectLine,
        smtpServer,
        smtpPort,
        emailUser,
        emailPass,
        senderName,
        variables,
        delayBetweenEmails = 2000,
        template
    } = req.body;

    if (!emailColumn || !smtpServer || !emailUser || !emailPass || !subjectLine) {
        return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }
    if (!excelPath || (!htmlPath && !template)) {
        return res.status(400).json({ success: false, message: 'Missing Excel file or HTML template' });
    }

    const jobId = Date.now().toString();
    activeSendingJobs.set(jobId, { shouldStop: false, startTime: new Date(), totalEmails: 0, sentEmails: 0, failedEmails: 0 });

    let data, templateContent;
    try {
        data = readExcelData(excelPath);
        templateContent = getTemplateContent(template, htmlPath);
    } catch (err) {
        activeSendingJobs.delete(jobId);
        return res.status(400).json({ success: false, message: 'Error reading files: ' + err.message });
    }

    const validRecipients = filterValidRecipients(data, emailColumn);
    if (validRecipients.length === 0) {
        activeSendingJobs.delete(jobId);
        return res.status(400).json({ success: false, message: 'No valid email addresses found' });
    }

    const MAX_EMAILS = 500;
    const recipientsToProcess = validRecipients.slice(0, MAX_EMAILS);
    const jobData = activeSendingJobs.get(jobId);
    jobData.totalEmails = recipientsToProcess.length;

    res.json({ success: true, jobId, total: recipientsToProcess.length, limit: MAX_EMAILS, skipped: validRecipients.length - MAX_EMAILS });

    const transporter = createTransporter({ smtpServer, smtpPort, emailUser, emailPass, delayBetweenEmails });

    sendEmailsJob({
        jobId,
        recipients: recipientsToProcess,
        emailColumn,
        nameColumn,
        subjectLine,
        senderName,
        templateContent,
        variables,
        transporter,
        delayBetweenEmails,
        activeSendingJobs,
    }).catch(err => {
        const jobData = activeSendingJobs.get(jobId);
        if (jobData) {
            jobData.error = err.message;
            jobData.completed = true;
        }
    });

    // Optionally, cleanup after 1 hour, etc.
});








async function downloadFromCloudinaryToTemp(url, filename) {
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download file from Cloudinary: ${response.statusText}`);
    }
    
    // const buffer = await response.buffer();
    const buffer = Buffer.from(await response.arrayBuffer());
    const tempPath = path.join(__dirname, 'temp', filename);
    
    // Ensure temp directory exists
    const tempDir = path.dirname(tempPath);
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    
    fs.writeFileSync(tempPath, buffer);
    return tempPath;
}

app.post('/campaign', uploadFormData.none(), async (req, res) => {
    let tempExcelPath = null;
    let tempTemplatePath = null;

    console.log(req.body)
    
    try {
        // Extract Cloudinary URLs and other data from form
        const {
            excelCloudinaryUrl,
            excelPublicId,
            templateCloudinaryUrl,
            templatePublicId,
            emailColumn,
            nameColumn,
            subjectLine,
            smtpServer,
            smtpPort,
            emailUser,
            emailPass,
            senderName,
            variables,
            delayBetweenEmails = 2000,
            templateContent,
            campaign_name
        } = req.body;

        console.log('Received campaign request:', {
            campaign_name,
            emailColumn,
            excelCloudinaryUrl,
            templateCloudinaryUrl
        });

        // Validate required fields
        if (!excelCloudinaryUrl) {
            return res.status(400).json({
                success: false,
                message: 'Excel file URL is required'
            });
        }

        try {
            validateEmailConfig({ emailColumn, subjectLine });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        // 1. Download Excel file from Cloudinary to temporary location for processing
        try {
            const excelFileName = `excel_${Date.now()}.xlsx`;
            tempExcelPath = await downloadFromCloudinaryToTemp(excelCloudinaryUrl, excelFileName);
            console.log('Excel file downloaded to:', tempExcelPath);
        } catch (error) {
            logError('Excel Download', error, { url: excelCloudinaryUrl });
            return res.status(400).json({
                success: false,
                message: 'Failed to download Excel file from cloud storage',
                error: error.message
            });
        }

        // 2. Preview Excel data using temporary file
        let excelPreview;
        try {
            excelPreview = previewExcel(tempExcelPath);
        } catch (error) {
            logError('Excel Preview', error, { filePath: tempExcelPath });
            return res.status(400).json({
                success: false,
                message: 'Invalid Excel file format',
                error: error.message
            });
        }

        // 3. Handle template - either from Cloudinary or from content
        let finalTemplateContent = '';
        
        if (templateContent && typeof templateContent === 'string' && templateContent.trim() !== '') {
            finalTemplateContent = templateContent.trim();
        } else if (templateCloudinaryUrl) {
            try {
                // Download template file from Cloudinary
                const templateFileName = `template_${Date.now()}.html`;
                tempTemplatePath = await downloadFromCloudinaryToTemp(templateCloudinaryUrl, templateFileName);
                finalTemplateContent = parseHtmlTemplate(tempTemplatePath);
            } catch (error) {
                logError('Template Download/Parse', error, { url: templateCloudinaryUrl });
                return res.status(400).json({
                    success: false,
                    message: 'Failed to download or parse HTML template',
                    error: error.message
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Either template content or template file is required'
            });
        }

        // 4. Process recipients first (needed for Elastic Email)
        let recipients = [];
        try {
            const recipientsRaw = readExcelData(tempExcelPath);
            recipients = filterValidRecipients(recipientsRaw, emailColumn);
            
            if (recipients.length === 0) {
                throw new Error('No valid email addresses found in the Excel file');
            }
        } catch (error) {
            logError('Recipients Processing', error, { excelPath: tempExcelPath });
            return res.status(400).json({
                success: false,
                message: 'Failed to process recipients',
                error: error.message
            });
        }

        // 5. Save campaign to Supabase with Cloudinary URLs
        const { data: campaignData, error: campaignError } = await supabase
            .from('campaigns')
            .insert([{
                excel_path: excelCloudinaryUrl,
                excel_public_id: excelPublicId,
                html_path: templateCloudinaryUrl || null,
                email_column: emailColumn,
                name_column: nameColumn,
                subject_line: subjectLine,
                smtp_server: smtpServer,
                smtp_port: smtpPort || 587,
                email_user: emailUser,
                email_pass: emailPass,
                sender_name: senderName,
                variables: typeof variables === 'string' ? variables : JSON.stringify(variables || []),
                delay_between_emails: parseInt(delayBetweenEmails),
                template: finalTemplateContent,
                campaign_name: campaign_name,
                status: 'pending',
                total_recipients: recipients.length, // Add total count
                emails_sent: 0, // Initialize sent count
                emails_failed: 0, // Initialize failed count
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (campaignError) {
            logError('Campaign Creation', campaignError);
            throw new Error(`Failed to create campaign: ${campaignError.message}`);
        }

        // 6. CREATE ELASTIC EMAIL CAMPAIGN USING V2 API
//         let elasticEmailCampaignId = null;
//         if (campaignData) {
//             try {
//                 const recipientEmails = recipients.map(r => r[emailColumn]);
//                 console.log('ElasticEmail V2 Payload:', {
//                     name: campaign_name,
//                     subject: subjectLine,
//                     from: emailUser,
//                     fromName: senderName,
//                     recipients: recipientEmails
//                 });

//                 if (recipientEmails.length === 0) {
//                     throw new Error('No recipient emails available for Elastic Email campaign');
//                 }


//                 const v4Payload = {
//   Name: campaign_name,
//   Status: "Active", // or "Draft"
//   Recipients: {
//     ListNames: ["YourList"], // You must manage Elastic Email lists/segments separately
//     SegmentNames: []
//   },
//   Content: [
//     {
//       TemplateName: "DirectSend",
//       EmailFrom: emailUser,
//       EmailFromName: senderName,
//       Subject: subjectLine,
//       BodyHtml: finalTemplateContent,
//       BodyText: "" // Optional plain text version
//     }
//   ],
//   Options: {
//     TrackOpens: "true",
//     TrackClicks: "true",
//     DeliveryOptimization: "None",
//     ScheduleFor: null,
//     TriggerFrequency: 0,
//     TriggerCount: 0,
//     SplitOptions: {}
//   }
// };

// const elasticResponse = await axios.post('https://api.elasticemail.com/v4/campaigns', v4Payload, {
//   headers: {
//     'Content-Type': 'application/json',
//     'Authorization': `Bearer ${process.env.ELASTIC_EMAIL_API_KEY}`
//   }
// });

// console.log(elasticResponse)

//                 // Create form data for v2 API
//                 // const formData = new URLSearchParams();
//                 // formData.append('apikey', process.env.ELASTIC_EMAIL_API_KEY);
//                 // formData.append('name', campaign_name);
//                 // formData.append('subject', subjectLine);
//                 // formData.append('from', emailUser);
//                 // formData.append('fromName', senderName);
//                 // formData.append('bodyHtml', finalTemplateContent);
//                 // formData.append('bodyText', ''); // Optional plain text version
//                 // formData.append('encodingType', '0'); // 0 = UTF-8
//                 // formData.append('isTemplate', 'false');
                
//                 // // Add recipients - v2 API accepts comma-separated emails
//                 // formData.append('to', recipientEmails.join(','));
                
//                 // // Additional settings for better analytics
//                 // formData.append('trackOpens', 'true');
//                 // formData.append('trackClicks', 'true');
//                 // formData.append('trackDelivered', 'true');
                
//                 // Create campaign using v2 API
//                 // const elasticResponse = await axios.post('https://api.elasticemail.com/v2/email/campaign/add', formData, {
//                 //     headers: {
//                 //         'Content-Type': 'application/x-www-form-urlencoded'
//                 //     }
//                 // });

//                 if (elasticResponse.data.success) {
//                     elasticEmailCampaignId = elasticResponse.data.data.campaignid;
//                     console.log('Elastic Email V2 Campaign Created:', elasticResponse.data);

//                     // Update campaign with Elastic Email ID
//                     await supabase
//                         .from('campaigns')
//                         .update({ 
//                             elastic_email_campaign_id: elasticEmailCampaignId
//                         })
//                         .eq('id', campaignData.id);

//                     // Optional: Send the campaign immediately
//                     // You can uncomment this if you want to send immediately
//                     /*
//                     const sendFormData = new URLSearchParams();
//                     sendFormData.append('apikey', process.env.ELASTIC_EMAIL_API_KEY);
//                     sendFormData.append('campaignid', elasticEmailCampaignId);
                    
//                     await axios.post('https://api.elasticemail.com/v2/email/campaign/send', sendFormData, {
//                         headers: {
//                             'Content-Type': 'application/x-www-form-urlencoded'
//                         }
//                     });
                    
//                     console.log('Elastic Email V2 Campaign Sent');
//                     */

//                 } else {
//                     throw new Error(elasticResponse.data.error || 'Failed to create Elastic Email campaign');
//                 }

//             } catch (elasticError) {
//                 const elasticErrorMessage = elasticError.response?.data?.error || 
//                                           elasticError.response?.data || 
//                                           elasticError.response?.statusText || 
//                                           elasticError.message || 
//                                           'Unknown Error';
//                 logError('ElasticEmail Campaign V2', elasticErrorMessage, { campaignId: campaignData.id });
//                 console.warn('Elastic Email campaign creation failed:', elasticErrorMessage);
                
//                 // Don't fail the entire campaign creation if Elastic Email fails
//                 // Just log the error and continue with regular email sending
//             }
//         }

        // 7. START EMAIL SENDING WITH TRACKING
        // Create transporter
        const transporter = createTransporter({ 
            delayBetweenEmails: parseInt(delayBetweenEmails),
        });

        const jobId = `campaign-${campaignData.id}`;
        const jobInfo = {
            id: jobId,
            campaignId: campaignData.id,
            total: recipients.length,
            sentEmails: 0,
            failedEmails: 0,
            shouldStop: false,
            completed: false,
            startedAt: new Date().toISOString(),
            // elasticEmailCampaignId: elasticEmailCampaignId
        };
        
        // Store job info in your tracking system
        activeSendingJobs.set(jobId, jobInfo);

        // Start sending with tracking (non-blocking)
        sendEmailsJob({
            jobId,
            recipients,
            emailColumn,
            nameColumn,
            subjectLine,
            senderName,
            emailUser,
            templateContent: finalTemplateContent,
            variables: Array.isArray(variables) ? variables : JSON.parse(variables || '[]'),
            transporter,
            delayBetweenEmails: parseInt(delayBetweenEmails),
            activeSendingJobs,
            uploadsPath: './uploads/images/',
            campaignId: campaignData.id,
        }).then(async () => {
            // Update campaign status to completed when email sending is finished
            try {
                const { error: updateError } = await supabase
                    .from('campaigns')
                    .update({ 
                        status: 'completed',
                    })
                    .eq('id', campaignData.id);

                if (updateError) {
                    logError('Campaign Status Update', updateError, { campaignId: campaignData.id });
                } else {
                    console.log(`Campaign ${campaignData.id} status updated to completed`);
                }
            } catch (updateErr) {
                logError('Campaign Status Update Error', updateErr, { campaignId: campaignData.id });
            }
        }).catch(async (error) => {
            logError('Email Sending Job', error, { jobId, campaignId: campaignData.id });
            const jobData = activeSendingJobs.get(jobId);
            if (jobData) {
                jobData.error = error.message;
                jobData.completed = true;
                jobData.endTime = new Date().toISOString();
            }
            
            // Update campaign status to failed when there's an error
            try {
                const { error: updateError } = await supabase
                    .from('campaigns')
                    .update({ 
                        status: 'failed',
                    })
                    .eq('id', campaignData.id);

                if (updateError) {
                    logError('Campaign Status Update (Failed)', updateError, { campaignId: campaignData.id });
                } else {
                    console.log(`Campaign ${campaignData.id} status updated to failed`);
                }
            } catch (updateErr) {
                logError('Campaign Status Update Error (Failed)', updateErr, { campaignId: campaignData.id });
            }
        });

        // 8. Respond with success
        res.json({
            success: true,
            message: 'Campaign created and emails are being sent with tracking enabled',
            jobId: jobId,
            total: recipients.length,
            campaign: {
                id: campaignData.id,
                name: campaignData.campaign_name,
                status: 'sending',
                // elasticEmailCampaignId: elasticEmailCampaignId
            },
            excelPreview
        });

    } catch (err) {
        logError('Campaign Route', err);
        res.status(500).json({
            success: false,
            message: 'Error creating campaign',
            error: err.message
        });
    } finally {
        // Clean up temporary files
        if (tempExcelPath && fs.existsSync(tempExcelPath)) {
            try {
                fs.unlinkSync(tempExcelPath);
                console.log('Cleaned up temp Excel file:', tempExcelPath);
            } catch (cleanupError) {
                console.error('Error cleaning up temp Excel file:', cleanupError);
            }
        }
        
        if (tempTemplatePath && fs.existsSync(tempTemplatePath)) {
            try {
                fs.unlinkSync(tempTemplatePath);
                console.log('Cleaned up temp template file:', tempTemplatePath);
            } catch (cleanupError) {
                console.error('Error cleaning up temp template file:', cleanupError);
            }
        }
    }
});



app.post('/campaign/draft', uploadFormData.none(), async (req, res) => {
   let tempExcelPath = null;
    let tempTemplatePath = null;

    console.log(req.body)
    
    try {
        // Extract Cloudinary URLs and other data from form
        const {
            excelCloudinaryUrl,
            excelPublicId,
            templateCloudinaryUrl,
            templatePublicId,
            emailColumn,
            nameColumn,
            subjectLine,
            smtpServer,
            smtpPort,
            emailUser,
            emailPass,
            senderName,
            variables,
            delayBetweenEmails = 2000,
            templateContent,
            campaign_name
        } = req.body;

        console.log('Received campaign request:', {
            campaign_name,
            emailColumn,
            excelCloudinaryUrl,
            templateCloudinaryUrl
        });

        // Validate required fields
        if (!excelCloudinaryUrl) {
            return res.status(400).json({
                success: false,
                message: 'Excel file URL is required'
            });
        }

        try {
            validateEmailConfig({ emailColumn, subjectLine });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        // 1. Download Excel file from Cloudinary to temporary location for processing
        try {
            const excelFileName = `excel_${Date.now()}.xlsx`;
            tempExcelPath = await downloadFromCloudinaryToTemp(excelCloudinaryUrl, excelFileName);
            console.log('Excel file downloaded to:', tempExcelPath);
        } catch (error) {
            logError('Excel Download', error, { url: excelCloudinaryUrl });
            return res.status(400).json({
                success: false,
                message: 'Failed to download Excel file from cloud storage',
                error: error.message
            });
        }

        // 2. Preview Excel data using temporary file
        let excelPreview;
        try {
            excelPreview = previewExcel(tempExcelPath);
        } catch (error) {
            logError('Excel Preview', error, { filePath: tempExcelPath });
            return res.status(400).json({
                success: false,
                message: 'Invalid Excel file format',
                error: error.message
            });
        }

        // 3. Handle template - either from Cloudinary or from content
        let finalTemplateContent = '';
        
        if (templateContent && typeof templateContent === 'string' && templateContent.trim() !== '') {
            finalTemplateContent = templateContent.trim();
        } else if (templateCloudinaryUrl) {
            try {
                // Download template file from Cloudinary
                const templateFileName = `template_${Date.now()}.html`;
                tempTemplatePath = await downloadFromCloudinaryToTemp(templateCloudinaryUrl, templateFileName);
                finalTemplateContent = parseHtmlTemplate(tempTemplatePath);
            } catch (error) {
                logError('Template Download/Parse', error, { url: templateCloudinaryUrl });
                return res.status(400).json({
                    success: false,
                    message: 'Failed to download or parse HTML template',
                    error: error.message
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Either template content or template file is required'
            });
        }

        // 4. Process recipients first (needed for Elastic Email)
        let recipients = [];
        try {
            const recipientsRaw = readExcelData(tempExcelPath);
            recipients = filterValidRecipients(recipientsRaw, emailColumn);
            
            if (recipients.length === 0) {
                throw new Error('No valid email addresses found in the Excel file');
            }
        } catch (error) {
            logError('Recipients Processing', error, { excelPath: tempExcelPath });
            return res.status(400).json({
                success: false,
                message: 'Failed to process recipients',
                error: error.message
            });
        }

        // 5. Save campaign to Supabase with Cloudinary URLs
        const { data: campaignData, error: campaignError } = await supabase
            .from('campaigns')
            .insert([{
                excel_path: excelCloudinaryUrl,
                excel_public_id: excelPublicId,
                html_path: templateCloudinaryUrl || null,
                email_column: emailColumn,
                name_column: nameColumn,
                subject_line: subjectLine,
                smtp_server: smtpServer,
                smtp_port: smtpPort || 587,
                email_user: emailUser,
                email_pass: emailPass,
                sender_name: senderName,
                variables: typeof variables === 'string' ? variables : JSON.stringify(variables || []),
                delay_between_emails: parseInt(delayBetweenEmails),
                template: finalTemplateContent,
                campaign_name: campaign_name,
                status: 'draft',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (campaignError) {
            logError('Draft Campaign Creation', campaignError);
            throw new Error(`Failed to create draft campaign: ${campaignError.message}`);
        }

        // Respond with success
        res.json({
            success: true,
            message: 'Draft campaign created successfully',
            campaign: {
                id: campaignData.id,
                name: campaignData.campaign_name,
                status: 'draft',
                created_at: campaignData.created_at
            }
        });

    } catch (err) {
        logError('Draft Campaign Route', err);
        res.status(500).json({
            success: false,
            message: 'Error creating draft campaign',
            error: err.message
        });
    }
});






// Enhanced route for tracking email opens
app.get('/api/track/open/:campaignId', async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { email } = req.query;
        
        // Log the open event
        console.log(`Email opened - Campaign: ${campaignId}, Email: ${email}, Timestamp: ${new Date().toISOString()}`);
        
        // Store open tracking data
        const { error } = await supabase
            .from('email_tracking')
            .update({ 
                opened_at: new Date().toISOString(),
                opened: true,
                updated_at: new Date().toISOString()
            })
            .eq('campaign_id', campaignId)
            .eq('recipient_email', email);
        
        if (error) {
            logError('Open Tracking Update', error, { campaignId, email });
        }
        
        // Return 1x1 transparent pixel
        const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': pixel.length,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        res.end(pixel);
        
    } catch (err) {
        logError('Open Tracking Route', err, { campaignId: req.params.campaignId });
        res.status(200).end(); // Still return success to avoid broken images
    }
});

// Route to get all campaigns with their tracking status
app.get('/campaigns', async (req, res) => {
    try {
        const { data: campaigns, error } = await supabase
            .from('campaigns')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        res.json({
            success: true,
            campaigns: campaigns.map(campaign => ({
                ...campaign,
                hasTracking: !!campaign.configuration_set,
                trackingEnabled: !!campaign.configuration_set
            }))
        });
        
    } catch (err) {
        console.error('Error getting campaigns:', err);
        res.status(500).json({
            success: false,
            message: 'Error retrieving campaigns',
            error: err.message
        });
    }
});

app.post('/upload-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file uploaded'
            });
        }

        // Upload to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(
            req.file.path, 
            'uploads/images', 
            'image'
        );

        // Clean up temporary file
        cleanupTempFile(req.file.path);

        res.json({
            success: true,
            imageUrl: cloudinaryResult.secure_url,
            originalName: req.file.originalname,
            cloudinaryPublicId: cloudinaryResult.public_id,
            filename: cloudinaryResult.public_id.split('/').pop(),
            cidName: cloudinaryResult.public_id.split('/').pop().split('.')[0]
        });

    } catch (error) {
        // Clean up temporary file in case of error
        if (req.file) {
            cleanupTempFile(req.file.path);
        }
        
        console.error('Image upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error uploading image'
        });
    }
});

// app.post('/upload-image', upload.single('image'), (req, res) => {
//     try {
//         const imageUrl = `/uploads/images/${req.file.filename}`;
//         res.json({
//             success: true,
//             imageUrl: imageUrl,
//             originalName: req.file.originalname,
//             filename: req.file.filename, // Include filename for CID reference
//             cidName: req.file.filename.split('.')[0] // CID name without extension
//         });
//     } catch (error) {
//         res.json({
//             success: false,
//             message: error.message
//         });
//     }
// });

app.delete('/campaigns/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // if (!id || isNaN(parseInt(id))) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Valid campaign ID is required'
        //     });
        // }

        // First, check if campaign exists and get file paths for cleanup
        const { data: campaign, error: fetchError } = await supabase
            .from('campaigns')
            .select('id, excel_path, html_path, status')
            .eq('id', id)
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Campaign not found'
                });
            }
            throw fetchError;
        }

        // Check if campaign is currently running
        if (campaign.status === 'sending') {
            // Stop the sending job if it's running
            const jobId = `campaign-${id}`;
            if (activeSendingJobs.has(jobId)) {
                const jobInfo = activeSendingJobs.get(jobId);
                jobInfo.shouldStop = true;
                activeSendingJobs.delete(jobId);
            }
        }

        // Delete the campaign from database
        const { error: deleteError } = await supabase
            .from('campaigns')
            .delete()
            .eq('id', id);

        if (deleteError) {
            throw deleteError;
        }

        // Clean up files if they exist
        const fs = require('fs');
        const path = require('path');

        if (campaign.excel_path && fs.existsSync(campaign.excel_path)) {
            try {
                fs.unlinkSync(campaign.excel_path);
                console.log(`Deleted Excel file: ${campaign.excel_path}`);
            } catch (fileError) {
                console.warn(`Could not delete Excel file: ${campaign.excel_path}`, fileError.message);
            }
        }

        if (campaign.html_path && fs.existsSync(campaign.html_path)) {
            try {
                fs.unlinkSync(campaign.html_path);
                console.log(`Deleted HTML file: ${campaign.html_path}`);
            } catch (fileError) {
                console.warn(`Could not delete HTML file: ${campaign.html_path}`, fileError.message);
            }
        }

        res.json({
            success: true,
            message: 'Campaign deleted successfully',
            deletedId: parseInt(id)
        });

    } catch (error) {
        console.error('Error deleting campaign:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting campaign',
            error: error.message
        });
    }
});


app.post('/schedule/:campaignId', async (req, res) => {
    try {
        console.log("endpoint hit")
        const { campaignId } = req.params;
        const { dateTime, timezone = 'Asia/Kolkata' } = req.body;

        // Validate input
        if (!dateTime) {
            return res.status(400).json({
                success: false,
                message: 'Date and time are required'
            });
        }

        // Validate datetime
        const validation = campaignScheduler.validateDateTime(dateTime);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.error
            });
        }

        // Schedule the campaign
        const result = await campaignScheduler.scheduleFromCalendar(
            campaignId, 
            dateTime, 
            timezone
        );

        res.json(result);

    } catch (error) {
        console.error('Error scheduling campaign:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
// app.post('/upload-image', upload.single('image'), (req, res) => {
//     try {
//         const imageUrl = `/uploads/images/${req.file.filename}`;
//         res.json({
//             success: true,
//             imageUrl: imageUrl,
//             originalName: req.file.originalname
//         });
//     } catch (error) {
//         res.json({
//             success: false,
//             message: error.message
//         });
//     }
// });

app.get('/get_campaigns', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*');

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching campaigns',
      error: error.message
    });
  }
});


// Get sending status endpoint
app.get('/send-status/:jobId', (req, res) => {
    const { jobId } = req.params;

    if (!jobId || !activeSendingJobs.has(jobId)) {
        return res.status(404).json({
            success: false,
            message: 'Job not found'
        });
    }

    const jobData = activeSendingJobs.get(jobId);

    res.json({
        success: true,
        jobId,
        total: jobData.totalEmails,
        sent: jobData.sentEmails,
        failed: jobData.failedEmails,
        completed: !!jobData.completed,
        stopped: !!jobData.stopped,
        error: jobData.error || null,
        startTime: jobData.startTime,
        endTime: jobData.endTime || null
    });
});

// Get all active jobs (for monitoring)
app.get('/jobs', (req, res) => {
    const jobs = [];
    activeSendingJobs.forEach((jobData, jobId) => {
        jobs.push({
            jobId,
            total: jobData.totalEmails,
            sent: jobData.sentEmails,
            failed: jobData.failedEmails,
            completed: !!jobData.completed,
            stopped: !!jobData.stopped,
            startTime: jobData.startTime,
            endTime: jobData.endTime || null
        });
    });

    res.json({
        success: true,
        jobs,
        totalActiveJobs: jobs.filter(job => !job.completed && !job.stopped).length
    });
});

// Clean up old files endpoint (optional maintenance)
app.post('/cleanup', (req, res) => {
    try {
        const directories = ['uploads/excel', 'uploads/html'];
        let cleanedFiles = 0;

        directories.forEach(dir => {
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir);
                const now = Date.now();
                const oneHourAgo = now - (60 * 60 * 1000); // 1 hour ago

                files.forEach(file => {
                    const filePath = path.join(dir, file);
                    const stats = fs.statSync(filePath);

                    if (stats.mtime.getTime() < oneHourAgo) {
                        fs.unlinkSync(filePath);
                        cleanedFiles++;
                    }
                });
            }
        });

        res.json({
            success: true,
            message: `Cleaned up ${cleanedFiles} old files`
        });
    } catch (err) {
        console.error('Cleanup error:', err);
        res.status(500).json({
            success: false,
            message: 'Error during cleanup',
            error: err.message
        });
    }
});


app.post('/campaigns/:id/schedule', async (req, res) => {
    try {
        const { id } = req.params;
        const { schedulePattern, timezone = 'Asia/Kolkata' } = req.body;

        if (!schedulePattern) {
            return res.status(400).json({
                success: false,
                message: 'Schedule pattern is required'
            });
        }

        // Validate cron pattern
        const validation = campaignScheduler.validateCronPattern(schedulePattern);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cron pattern',
                error: validation.error
            });
        }

        // Get campaign from database
        const { data: campaign, error: fetchError } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        // Update campaign with schedule info
        const { error: updateError } = await supabase
            .from('campaigns')
            .update({
                is_scheduled: true,
                schedule_pattern: schedulePattern,
                status: 'scheduled',
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) throw updateError;

        // Schedule the campaign
        const updatedCampaign = { ...campaign, schedule_pattern: schedulePattern, is_scheduled: true };
        await campaignScheduler.scheduleCampaign(updatedCampaign);

        res.json({
            success: true,
            message: 'Campaign scheduled successfully',
            schedule: {
                pattern: schedulePattern,
                timezone: timezone
            }
        });

    } catch (error) {
        console.error('Error scheduling campaign:', error);
        res.status(500).json({
            success: false,
            message: 'Error scheduling campaign',
            error: error.message
        });
    }
});

// Unschedule a campaign
app.delete('/campaigns/:id/schedule', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id)


        await campaignScheduler.unscheduleCampaign(id);

        res.json({
            success: true,
            message: 'Campaign unscheduled successfully'
        });

    } catch (error) {
        console.error('Error unscheduling campaign:', error);
        res.status(500).json({
            success: false,
            message: 'Error unscheduling campaign',
            error: error.message
        });
    }
});

// Get campaign schedule status
app.get('/campaigns/:id/schedule', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: campaign, error } = await supabase
            .from('campaigns')
            .select('is_scheduled, schedule_pattern, last_executed, execution_count, last_error, status')
            .eq('id', id)
            .single();

        if (error || !campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        const scheduleStatus = campaignScheduler.getScheduleStatus(id);

        res.json({
            success: true,
            schedule: {
                isScheduled: campaign.is_scheduled,
                pattern: campaign.schedule_pattern,
                lastExecuted: campaign.last_executed,
                executionCount: campaign.execution_count,
                lastError: campaign.last_error,
                status: campaign.status,
                jobActive: scheduleStatus.jobExists
            }
        });

    } catch (error) {
        console.error('Error getting schedule status:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting schedule status',
            error: error.message
        });
    }
});

// Get all scheduled campaigns
app.get('/campaigns/scheduled', async (req, res) => {
    try {
        const { data: campaigns, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('is_scheduled', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const scheduledCampaigns = campaigns.map(campaign => ({
            ...campaign,
            jobActive: campaignScheduler.getScheduleStatus(campaign.id).jobExists
        }));

        res.json({
            success: true,
            campaigns: scheduledCampaigns
        });

    } catch (error) {
        console.error('Error getting scheduled campaigns:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting scheduled campaigns',
            error: error.message
        });
    }
});

// Validate cron pattern
app.post('/validate-cron', (req, res) => {
    try {
        const { pattern } = req.body;

        if (!pattern) {
            return res.status(400).json({
                success: false,
                message: 'Cron pattern is required'
            });
        }

        const validation = campaignScheduler.validateCronPattern(pattern);
        
        if (validation.valid) {
            const nextExecutions = campaignScheduler.getNextExecutions(pattern);
            
            res.json({
                success: true,
                valid: true,
                pattern: pattern,
                nextExecutions: nextExecutions.executions || []
            });
        } else {
            res.json({
                success: false,
                valid: false,
                error: validation.error
            });
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error validating cron pattern',
            error: error.message
        });
    }
});

// Get predefined schedule patterns
app.get('/schedule-patterns', (req, res) => {
    const { SchedulePatterns } = require('./services/schedulerservice');
    
    const patterns = {
        testing: {
            'Every Minute': SchedulePatterns.EVERY_MINUTE,
        },
        hourly: {
            'Every Hour': SchedulePatterns.EVERY_HOUR,
            'Every 2 Hours': SchedulePatterns.EVERY_2_HOURS,
            'Every 6 Hours': SchedulePatterns.EVERY_6_HOURS,
            'Every 12 Hours': SchedulePatterns.EVERY_12_HOURS,
        },
        daily: {
            'Daily at 9 AM': SchedulePatterns.DAILY_9AM,
            'Daily at 6 PM': SchedulePatterns.DAILY_6PM,
            'Daily at Midnight': SchedulePatterns.DAILY_MIDNIGHT,
        },
        weekly: {
            'Weekly Monday 9 AM': SchedulePatterns.WEEKLY_MONDAY_9AM,
            'Weekly Friday 5 PM': SchedulePatterns.WEEKLY_FRIDAY_5PM,
        },
        monthly: {
            'Monthly 1st at 9 AM': SchedulePatterns.MONTHLY_FIRST_9AM,
            'Monthly 15th at 6 PM': SchedulePatterns.MONTHLY_15TH_6PM,
        }
    };

    res.json({
        success: true,
        patterns: patterns,
        info: {
            format: 'minute hour day month dayOfWeek',
            examples: {
                '0 9 * * *': 'Every day at 9:00 AM',
                '0 */2 * * *': 'Every 2 hours',
                '0 9 * * 1': 'Every Monday at 9:00 AM',
                '0 18 1 * *': 'First day of every month at 6:00 PM'
            }
        }
    });
});

// Trigger immediate execution of a scheduled campaign (for testing)
app.post('/campaigns/:id/execute-now', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: campaign, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        if (!campaign.is_scheduled) {
            return res.status(400).json({
                success: false,
                message: 'Campaign is not scheduled'
            });
        }

        // Execute the campaign immediately
        await campaignScheduler.executeCampaign(campaign);

        res.json({
            success: true,
            message: 'Campaign execution triggered',
            campaignName: campaign.campaign_name
        });

    } catch (error) {
        console.error('Error executing campaign:', error);
        res.status(500).json({
            success: false,
            message: 'Error executing campaign',
            error: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 10MB.'
            });
        }
    }

    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Graceful shutdown
// process.on('SIGTERM', () => {
//     console.log('SIGTERM received, shutting down gracefully');

//     // Stop all active sending jobs
//     activeSendingJobs.forEach((jobData, jobId) => {
//         if (!jobData.completed && !jobData.stopped) {
//             jobData.shouldStop = true;
//             console.log(`Stopping job ${jobId} due to server shutdown`);
//         }
//     });
//      campaignScheduler.cleanup();

//     // Give some time for jobs to stop gracefully
//     setTimeout(() => {
//         process.exit(0);
//     }, 5000);
// });

// process.on('SIGINT', () => {
//     console.log('SIGINT received, shutting down gracefully');

//     // Stop all active sending jobs
//     activeSendingJobs.forEach((jobData, jobId) => {
//         if (!jobData.completed && !jobData.stopped) {
//             jobData.shouldStop = true;
//             console.log(`Stopping job ${jobId} due to server shutdown`);
//         }
//     });
//      campaignScheduler.cleanup();

//     // Give some time for jobs to stop gracefully
//     setTimeout(() => {
//         process.exit(0);
//     }, 5000);
// });

// Graceful shutdown (Render-friendly)
process.on('SIGTERM', () => {
  console.log('SIGTERM received, cleaning up...');
  
  // Stop all active sending jobs
  activeSendingJobs.forEach((jobData, jobId) => {
    if (!jobData.completed && !jobData.stopped) {
      jobData.shouldStop = true;
      console.log(`Stopping job ${jobId} due to shutdown signal`);
    }
  });

  // Cleanup campaign scheduler
  if (campaignScheduler && typeof campaignScheduler.cleanup === 'function') {
    campaignScheduler.cleanup();
  }

  // ⚠️ Do NOT call process.exit() here.
  // Render will handle container shutdown by itself.
});

process.on('SIGINT', () => {
  console.log('SIGINT received, cleaning up...');
  
  activeSendingJobs.forEach((jobData, jobId) => {
    if (!jobData.completed && !jobData.stopped) {
      jobData.shouldStop = true;
      console.log(`Stopping job ${jobId} due to shutdown signal`);
    }
  });

  if (campaignScheduler && typeof campaignScheduler.cleanup === 'function') {
    campaignScheduler.cleanup();
  }
});


async function uploadToCloudinary(filePath, folder, resourceType = 'auto') {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true
        });
        return result;
    } catch (error) {
        throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
}


function cleanupTempFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error('Error cleaning up temp file:', error);
    }
}

async function downloadFromCloudinary(publicId, localPath) {
    try {
        const url = cloudinary.url(publicId, { resource_type: 'raw' });
        const response = await fetch(url);
        const buffer = await response.buffer();
        fs.writeFileSync(localPath, buffer);
        return localPath;
    } catch (error) {
        throw new Error(`Failed to download from Cloudinary: ${error.message}`);
    }
}

// Optional: Function to delete file from Cloudinary
async function deleteFromCloudinary(publicId, resourceType = 'auto') {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });
        return result;
    } catch (error) {
        throw new Error(`Failed to delete from Cloudinary: ${error.message}`);
    }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});






