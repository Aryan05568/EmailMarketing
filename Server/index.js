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
// const upload = multer({
//     storage,
//     limits: {
//         fileSize: 10 * 1024 * 1024 // 10MB limit
//     },
//     fileFilter: (req, file, cb) => {
//         if (file.fieldname === 'excel') {
//             if (file.mimetype.includes('spreadsheet') || file.originalname.match(/\.(xlsx|xls)$/)) {
//                 cb(null, true);
//             } else {
//                 cb(new Error('Only Excel files are allowed'), false);
//             }
//         } else if (file.fieldname === 'template') {
//             if (file.mimetype === 'text/html' || file.originalname.match(/\.(html|htm)$/)) {
//                 cb(null, true);
//             } else {
//                 cb(new Error('Only HTML files are allowed'), false);
//             }
//         } else if (file.fieldname === 'image') {
//             if (file.mimetype.startsWith('image/') || file.originalname.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
//                 cb(null, true);
//             } else {
//                 cb(new Error('Only image files are allowed'), false);
//             }
//         } else {
//             cb(new Error('Invalid field name. Allowed fields: excel, template, image'), false);
//         }
//     }
// });



// Serve the HTML file (if you want to serve it from backend)
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

app.get('/', (req, res) => {
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




// app.post('/upload-template', upload.single('template'), (req, res) => {
//     try { //neww
//         if (!req.file) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'No template file uploaded'
//             });
//         }

//         const htmlPath = req.file.path;
//         const template = parseHtmlTemplate(htmlPath);

//         res.json({
//             success: true,
//             filePath: htmlPath,
//             template
//         });
//     } catch (err) {
//         console.error('Error processing HTML template:', err);
//         res.status(500).json({
//             success: false,
//             message: 'Error processing HTML template',
//             error: err.message
//         });
//     }
// });



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






// app.post('/campaign', upload.fields([
//     { name: 'excel', maxCount: 1 },
//     { name: 'template', maxCount: 1 }
// ]), async(req, res) => {
//     try {
//         // Check if Excel file exists
//         if (!req.files || !req.files.excel || !req.files.excel[0]) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Excel file is required'
//             });
//         }

//         const excelFile = req.files.excel[0];
//         const templateFile = req.files && req.files.template && req.files.template[0];

//         // 1. Preview Excel data
//         const excelPreview = previewExcel(excelFile.path);

//         // 2. Extract values from body
//         const {
//             emailColumn,
//             nameColumn,
//             subjectLine,
//             smtpServer,
//             smtpPort,
//             emailUser,
//             emailPass,
//             senderName,
//             variables,
//             delayBetweenEmails = 2000,
//             templateContent, // Use templateContent instead of template
//             campaign_name
//         } = req.body;
//         console.log('Received body:', req.body);

//         // Validate required fields
//         // if (!emailColumn || !subjectLine || !smtpServer || !emailUser || !emailPass) {
//         //     return res.status(400).json({
//         //         success: false,
//         //         message: 'Missing required fields: emailColumn, subjectLine, smtpServer, emailUser, emailPass'
//         //     });
//         // }

//         // Validate SMTP
//         // await testSMTPConnection({ smtpServer, smtpPort, emailUser, emailPass });

//         // 3. Use template content or uploaded template file
//         let finalTemplateContent = '';
        
//         if (templateContent && typeof templateContent === 'string' && templateContent.trim() !== '') {
//             finalTemplateContent = templateContent.trim();
//         } else if (templateFile && templateFile.path) {
//             finalTemplateContent = parseHtmlTemplate(templateFile.path);
//         } else {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Either template content or template file is required'
//             });
//         }

//         // 4. Save campaign to Supabase
//         const { data, error } = await supabase
//             .from('campaigns')
//             .insert([{
//                 excel_path: excelFile.path,
//                 html_path: templateFile ? templateFile.path : null,
//                 email_column: emailColumn,
//                 name_column: nameColumn,
//                 subject_line: subjectLine,
//                 smtp_server: smtpServer,
//                 smtp_port: smtpPort,
//                 email_user: emailUser,
//                 email_pass: emailPass,
//                 sender_name: senderName,
//                 variables,
//                 delay_between_emails: parseInt(delayBetweenEmails),
//                 template: finalTemplateContent,
//                 campaign_name: campaign_name,
//                 status: 'pending'
//             }])
//             .select()
//             .single();

//         if (error) throw error;

//         // 5. START EMAIL SENDING IMMEDIATELY USING HELPERS
//         const recipientsRaw = readExcelData(excelFile.path);
//         const recipients = filterValidRecipients(recipientsRaw, emailColumn);
//         const transporter = createTransporter({ smtpServer, smtpPort, emailUser, emailPass, delayBetweenEmails });

//         const jobId = `campaign-${data.id}`;
//         const jobInfo = {
//             id: jobId,
//             total: recipients.length,
//             sentEmails: 0,
//             failedEmails: 0,
//             shouldStop: false,
//             completed: false,
//             startedAt: new Date()
//         };
//         activeSendingJobs.set(jobId, jobInfo);

//         // Start sending (non-blocking)
//         sendEmailsJob({
//             jobId,
//             recipients,
//             emailColumn,
//             nameColumn,
//             subjectLine,
//             senderName,
//             templateContent: finalTemplateContent,
//             variables: Array.isArray(variables) ? variables : JSON.parse(variables || '[]'),
//             transporter,
//             delayBetweenEmails: parseInt(delayBetweenEmails),
//             activeSendingJobs,
//              uploadsPath: './uploads/images/' // Add this for CID support
//         });

//         // 6. Respond with success
//         res.json({
//             success: true,
//             message: 'Campaign created and emails are being sent',
//             jobId: jobId,
//             total: recipients.length,
//             campaign: data,
//             excelPreview
//         });

//     } catch (err) {
//         console.error('Error creating campaign:', err);
//         res.status(500).json({
//             success: false,
//             message: 'Error creating campaign',
//             error: err.message
//         });
//     }
// });

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

app.post('/campaign',uploadFormData.none(), async (req, res) => {
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

        // 4. Save campaign to Supabase with Cloudinary URLs
        const { data: campaignData, error: campaignError } = await supabase
            .from('campaigns')
            .insert([{
                excel_path: excelCloudinaryUrl, // Store Cloudinary URL instead of local path
                excel_public_id: excelPublicId, // Store public ID for reference
                html_path: templateCloudinaryUrl || null, // Store Cloudinary URL
                // html_public_id: templatePublicId || null, // Store public ID
                email_column: emailColumn,
                name_column: nameColumn,
                subject_line: subjectLine,
                smtp_server: smtpServer ,
                smtp_port: smtpPort || 587,
                email_user: emailUser,
                email_pass: emailPass,
                sender_name: senderName,
                variables: typeof variables === 'string' ? variables : JSON.stringify(variables || []),
                delay_between_emails: parseInt(delayBetweenEmails),
                template: finalTemplateContent,
                campaign_name: campaign_name,
                status: 'pending',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();


//   if (campaignData) {
//     try {
//         const recipientEmails = recipients.map(r => r[emailColumn]);
//         console.log('ElasticEmail Payload:', {
//             Name: campaign_name,
//             Subject: subjectLine,
//             From: emailUser,
//             FromName: senderName,
//             Recipients: recipientEmails
//         });

//         if (recipientEmails.length === 0) {
//             throw new Error('No recipient emails available for Elastic Email campaign');
//         }

//         const elasticResponse = await axios.post('https://api.elasticemail.com/v4/campaigns', {
//             Name: campaign_name,
//             Subject: subjectLine,
//             From: emailUser,
//             FromName: senderName,
//             Content: {
//                 Body: [
//                     {
//                         ContentType: "HTML",
//                         Charset: "utf-8",
//                         Content: finalTemplateContent
//                     }
//                 ]
//             },
//             Recipients: {
//                 Emails: recipientEmails
//             }
//         }, {
//             headers: {
//                 'X-ElasticEmail-ApiKey': process.env.ELASTIC_EMAIL_API_KEY,
//                 'Content-Type': 'application/json'
//             }
//         });

//         console.log('Elastic Email Campaign Created:', elasticResponse.data);
//     } catch (elasticError) {
//         const elasticErrorMessage = elasticError.response?.data || elasticError.response?.statusText || elasticError.message || 'Unknown Error';
//         logError('ElasticEmail Campaign', elasticErrorMessage, { campaignId: campaignData.id });
//         console.warn('Elastic Email campaign creation failed:', elasticErrorMessage);
//     }
// }


        if (campaignError) {
            logError('Campaign Creation', campaignError);
            throw new Error(`Failed to create campaign: ${campaignError.message}`);
        }

  

        // 7. START EMAIL SENDING WITH TRACKING
        let recipients = [];
        try {
            const recipientsRaw = readExcelData(tempExcelPath); // Use temp file for processing
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

        // Create transporter
        const transporter = createTransporter({ 
            delayBetweenEmails: parseInt(delayBetweenEmails),
            // configurationSet: configSetName
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
            startedAt: new Date().toISOString()
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
            uploadsPath: './uploads/images/', // You might want to change this to use Cloudinary URLs
            campaignId: campaignData.id,
            // configurationSet: configSetName,
        }).catch(error => {
            logError('Email Sending Job', error, { jobId, campaignId: campaignData.id });
            const jobData = activeSendingJobs.get(jobId);
            if (jobData) {
                jobData.error = error.message;
                jobData.completed = true;
                jobData.endTime = new Date().toISOString();
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
                // configurationSet: configSetName
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


// app.post('/campaign', upload.fields([
//     { name: 'excel', maxCount: 1 },
//     { name: 'template', maxCount: 1 }
// ]), async(req, res) => {
//     try {
//         // Check if Excel file exists
//         // if (!req.files || !req.files.excel || !req.files.excel[0]) {
//         //     return res.status(400).json({
//         //         success: false,
//         //         message: 'Excel file is required'
//         //     });
//         // }

//         const excelFile = req.files
//         console.log(excelFile)
//         const templateFile = req.files && req.files.template && req.files.template[0];

//         // 1. Preview Excel data
//         let excelPreview;
//         try {
//             excelPreview = previewExcel(excelFile.path);
//         } catch (error) {
//             logError('Excel Preview', error, { filePath: excelFile.path });
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid Excel file format',
//                 error: error.message
//             });
//         }

//         // 2. Extract and validate values from body
//         const {
//             emailColumn,
//             nameColumn,
//             subjectLine,
//             smtpServer,
//             smtpPort,
//             emailUser,
//             emailPass,
//             senderName,
//             variables,
//             delayBetweenEmails = 2000,
//             templateContent,
//             campaign_name
//         } = req.body;

//         console.log('Received campaign request:', {
//             campaign_name,
//             emailColumn,
//             totalRecipients: excelPreview?.length || 0
//         });

//         // Validate required fields
//         try {
//             validateEmailConfig({ emailColumn, subjectLine });
//         } catch (error) {
//             return res.status(400).json({
//                 success: false,
//                 message: error.message
//             });
//         }

//         // 3. Use template content or uploaded template file
//         let finalTemplateContent = '';
        
//         if (templateContent && typeof templateContent === 'string' && templateContent.trim() !== '') {
//             finalTemplateContent = templateContent.trim();
//         } else if (templateFile && templateFile.path) {
//             try {
//                 finalTemplateContent = parseHtmlTemplate(templateFile.path);
//             } catch (error) {
//                 logError('Template Parsing', error, { filePath: templateFile.path });
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Failed to parse HTML template',
//                     error: error.message
//                 });
//             }
//         } else {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Either template content or template file is required'
//             });
//         }

//         // 4. Save campaign to Supabase
//         const { data: campaignData, error: campaignError } = await supabase
//             .from('campaigns')
//             .insert([{
//                 excel_path: excelFile.path,
//                 html_path: templateFile ? templateFile.path : null,
//                 email_column: emailColumn,
//                 name_column: nameColumn,
//                 subject_line: subjectLine,
//                 smtp_server: smtpServer || 'email-smtp.ap-south-1.amazonaws.com',
//                 smtp_port: smtpPort || 587,
//                 email_user: emailUser,
//                 email_pass: emailPass,
//                 sender_name: senderName,
//                 variables: typeof variables === 'string' ? variables : JSON.stringify(variables || []),
//                 delay_between_emails: parseInt(delayBetweenEmails),
//                 template: finalTemplateContent,
//                 campaign_name: campaign_name,
//                 status: 'pending',
//                 created_at: new Date().toISOString()
//             }])
//             .select()
//             .single();

//         if (campaignError) {
//             logError('Campaign Creation', campaignError);
//             throw new Error(`Failed to create campaign: ${campaignError.message}`);
//         }

//         // 5. CREATE SES CONFIGURATION SET FOR TRACKING
//         const configSetName = `campaign-${campaignData.id}-tracking`;
        
//         try {
//             await createConfigurationSet(configSetName);
//         } catch (configError) {
//             logError('Configuration Set Creation', configError, { configSetName });
//             // Continue even if config set creation fails - email can still be sent
//             console.warn('Continuing without configuration set due to error:', configError.message);
//         }

//         // 6. Update campaign with configuration set name
//         const { error: updateError } = await supabase
//             .from('campaigns')
//             .update({ 
//                 configuration_set: configSetName,
//                 status: 'sending',
//                 created_at: new Date().toISOString()
//             })
//             .eq('id', campaignData.id);

//         if (updateError) {
//             logError('Campaign Update', updateError, { campaignId: campaignData.id });
//         }

//         // 7. START EMAIL SENDING WITH TRACKING
//         let recipients = [];
//         try {
//             const recipientsRaw = readExcelData(excelFile.path);
//             recipients = filterValidRecipients(recipientsRaw, emailColumn);
            
//             if (recipients.length === 0) {
//                 throw new Error('No valid email addresses found in the Excel file');
//             }
//         } catch (error) {
//             logError('Recipients Processing', error, { excelPath: excelFile.path });
//             return res.status(400).json({
//                 success: false,
//                 message: 'Failed to process recipients',
//                 error: error.message
//             });
//         }

//         // Create transporter
//         const transporter = createTransporter({ 
//             delayBetweenEmails: parseInt(delayBetweenEmails),
//             configurationSet: configSetName
//         });

//         const jobId = `campaign-${campaignData.id}`;
//         const jobInfo = {
//             id: jobId,
//             campaignId: campaignData.id,
//             total: recipients.length,
//             sentEmails: 0,
//             failedEmails: 0,
//             shouldStop: false,
//             completed: false,
//             startedAt: new Date().toISOString()
//         };
        
//         // Store job info in your tracking system
//         activeSendingJobs.set(jobId, jobInfo);

//         // Start sending with tracking (non-blocking)
//         sendEmailsJob({
//             jobId,
//             recipients,
//             emailColumn,
//             nameColumn,
//             subjectLine,
//             senderName,
//             templateContent: finalTemplateContent,
//             variables: Array.isArray(variables) ? variables : JSON.parse(variables || '[]'),
//             transporter,
//             delayBetweenEmails: parseInt(delayBetweenEmails),
//             activeSendingJobs,
//             uploadsPath: './uploads/images/',
//             campaignId: campaignData.id,
//             configurationSet: configSetName,
           
//         }).catch(error => {
//             logError('Email Sending Job', error, { jobId, campaignId: campaignData.id });
//             // Update job status
//             const jobData = activeSendingJobs.get(jobId);
//             if (jobData) {
//                 jobData.error = error.message;
//                 jobData.completed = true;
//                 jobData.endTime = new Date().toISOString();
//             }
//         });

//         // 8. Respond with success
//         res.json({
//             success: true,
//             message: 'Campaign created and emails are being sent with tracking enabled',
//             jobId: jobId,
//             total: recipients.length,
//             campaign: {
//                 id: campaignData.id,
//                 name: campaignData.campaign_name,
//                 status: 'sending',
//                 configurationSet: configSetName
//             },
//             excelPreview
//         });

//     } catch (err) {
//         logError('Campaign Route', err);
//         res.status(500).json({
//             success: false,
//             message: 'Error creating campaign',
//             error: err.message
//         });
//     }
// });


// app.get('/campaign/:id/stats', async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { startDate, endDate } = req.query;
        
//         // Get campaign details
//         const { data: campaign, error } = await supabase
//             .from('campaigns')
//             .select('*')
//             .eq('id', id)
//             .single();
            
//         if (error || !campaign) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Campaign not found'
//             });
//         }
        
//         // const configSetName = campaign.configuration_set;
//         // if (!configSetName) {
//         //     return res.status(400).json({
//         //         success: false,
//         //         message: 'Campaign does not have tracking enabled'
//         //     });
//         // }
        
//         // Get statistics from CloudWatch
//         const start = startDate ? new Date(startDate) : new Date(campaign.created_at);
//         const end = endDate ? new Date(endDate) : new Date();
        
//         let stats = {};
//         try {
//             stats = await getCampaignStats(configSetName, start, end);
//         } catch (error) {
//             logError('Campaign Stats Retrieval', error, { configSetName, campaignId: id });
//             return res.status(500).json({
//                 success: false,
//                 message: 'Failed to retrieve campaign statistics',
//                 error: error.message
//             });
//         }
        
//         // Calculate derived metrics
//         const deliveryRate = stats.Send > 0 ? (stats.Delivery / stats.Send * 100).toFixed(2) : 0;
//         const bounceRate = stats.Send > 0 ? (stats.Bounce / stats.Send * 100).toFixed(2) : 0;
//         const complaintRate = stats.Send > 0 ? (stats.Complaint / stats.Send * 100).toFixed(2) : 0;
//         const openRate = stats.Delivery > 0 ? (stats.Open / stats.Delivery * 100).toFixed(2) : 0;
//         const clickRate = stats.Delivery > 0 ? (stats.Click / stats.Delivery * 100).toFixed(2) : 0;
        
//         res.json({
//             success: true,
//             campaign: {
//                 id: campaign.id,
//                 name: campaign.campaign_name,
//                 // configurationSet: configSetName,
//                 status: campaign.status,
//                 createdAt: campaign.created_at,
//                 startedAt: campaign.started_at
//             },
//             statistics: {
//                 sent: stats.Send || 0,
//                 delivered: stats.Delivery || 0,
//                 bounced: stats.Bounce || 0,
//                 complaints: stats.Complaint || 0,
//                 opens: stats.Open || 0,
//                 clicks: stats.Click || 0
//             },
//             rates: {
//                 deliveryRate: `${deliveryRate}%`,
//                 bounceRate: `${bounceRate}%`,
//                 complaintRate: `${complaintRate}%`,
//                 openRate: `${openRate}%`,
//                 clickRate: `${clickRate}%`
//             },
//             period: {
//                 startDate: start.toISOString(),
//                 endDate: end.toISOString()
//             }
//         });
        
//     } catch (err) {
//         logError('Campaign Stats Route', err, { campaignId: req.params.id });
//         res.status(500).json({
//             success: false,
//             message: 'Error retrieving campaign statistics',
//             error: err.message
//         });
//     }
// });

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
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');

    // Stop all active sending jobs
    activeSendingJobs.forEach((jobData, jobId) => {
        if (!jobData.completed && !jobData.stopped) {
            jobData.shouldStop = true;
            console.log(`Stopping job ${jobId} due to server shutdown`);
        }
    });
     campaignScheduler.cleanup();

    // Give some time for jobs to stop gracefully
    setTimeout(() => {
        process.exit(0);
    }, 5000);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');

    // Stop all active sending jobs
    activeSendingJobs.forEach((jobData, jobId) => {
        if (!jobData.completed && !jobData.stopped) {
            jobData.shouldStop = true;
            console.log(`Stopping job ${jobId} due to server shutdown`);
        }
    });
     campaignScheduler.cleanup();

    // Give some time for jobs to stop gracefully
    setTimeout(() => {
        process.exit(0);
    }, 5000);
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