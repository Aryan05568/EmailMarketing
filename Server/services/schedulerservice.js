// services/schedulerservice.js
const cron = require('node-cron');
const supabase = require('../config/supabase_client');
const fs = require('fs');
const path = require('path');
const {
    readExcelData,
    getTemplateContent,
    filterValidRecipients,
    createTransporter,
    sendEmailsJob
} = require('./emailhelper');


async function downloadFromCloudinaryToTemp(cloudinaryUrl, fileName) {
    try {
        const response = await fetch(cloudinaryUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
        }
        
        // Use arrayBuffer() for newer fetch API
        const buffer = Buffer.from(await response.arrayBuffer());
        
        // Create temp directory if it doesn't exist
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Create temp file path
        const tempFilePath = path.join(tempDir, fileName);
        
        // Write buffer to temp file
        fs.writeFileSync(tempFilePath, buffer);
        
        return tempFilePath;
    } catch (error) {
        throw new Error(`Failed to download file from Cloudinary: ${error.message}`);
    }
}


class CampaignScheduler {
    constructor() {
        this.scheduledJobs = new Map(); // Store active cron jobs
        this.activeSendingJobs = null; // Will be set from main app
        this.init();
    }

    // Initialize scheduler - load existing scheduled campaigns
    async init() {
        try {
            console.log('Initializing Campaign Scheduler...');
            await this.loadScheduledCampaigns();
            console.log('Campaign Scheduler initialized successfully');
        } catch (error) {
            console.error('Error initializing scheduler:', error);
        }
    }

    // Set reference to active sending jobs from main app
    setActiveSendingJobs(activeSendingJobs) {
        this.activeSendingJobs = activeSendingJobs;
    }

    // Load and schedule existing campaigns from database
    async loadScheduledCampaigns() {
        try {
            const { data: campaigns, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('is_scheduled', true)
                .eq('status', 'scheduled');

            if (error) throw error;

            for (const campaign of campaigns) {
                if (campaign.schedule_pattern) {
                    await this.scheduleCampaign(campaign);
                }
            }

            console.log(`Loaded ${campaigns.length} scheduled campaigns`);
        } catch (error) {
            console.error('Error loading scheduled campaigns:', error);
        }
    }

    // Schedule a campaign
    async scheduleCampaign(campaign) {
        try {
            const { id, schedule_pattern, campaign_name } = campaign;
            
            if (this.scheduledJobs.has(id)) {
                // If already scheduled, destroy existing job first
                this.scheduledJobs.get(id).destroy();
            }

            // Create cron job
            const job = cron.schedule(schedule_pattern, async () => {
                console.log(`Executing scheduled campaign: ${campaign_name} (ID: ${id})`);
                await this.executeCampaign(campaign);
            }, {
                scheduled: true,
                timezone: "Asia/Kolkata" // Adjust timezone as needed
            });

            this.scheduledJobs.set(id, job);
            
            // job.start(); // Start the job immediately
            console.log(`Scheduled job for campaign ${campaign_name} with pattern: ${schedule_pattern}`);
            // Update campaign status in database
            await supabase
                .from('campaigns')
                .update({ status: 'scheduled' })
                .eq('id', id);

            // console.log(`Campaign ${campaign_name} scheduled with pattern: ${schedule_pattern}`);
            return { success: true, message: 'Campaign scheduled successfully' };

        } catch (error) {
            console.error('Error scheduling campaign:', error);
            throw error;
        }
    }

    // Execute a scheduled campaign
    async executeCampaign(campaign) {
        let tempExcelPath = null;
        try {
            const {
                id,
                excel_path,
                email_column,
                name_column,
                subject_line,
                smtp_server,
                smtp_port,
                email_user,
                email_pass,
                sender_name,
                variables,
                delay_between_emails,
                template,
                campaign_name
            } = campaign;

            console.log(`Starting scheduled execution of campaign: ${campaign_name}`);

            // Update campaign status to sending
            await supabase
                .from('campaigns')
                .update({ 
                    status: 'sending',
                    last_executed: new Date().toISOString()
                })
                .eq('id', id);

            // Read Excel data and filter recipients
            console.log(excel_path)
             try {
                const excelFileName = `scheduled_excel_${id}_${Date.now()}.xlsx`;
                tempExcelPath = await downloadFromCloudinaryToTemp(excel_path, excelFileName);
                console.log('Excel file downloaded to:', tempExcelPath);
            } catch (downloadError) {
                console.error('Failed to download Excel file:', downloadError);
                throw new Error(`Failed to download Excel file: ${downloadError.message}`);
            }
             const recipientsRaw = readExcelData(tempExcelPath);
            const recipients = filterValidRecipients(recipientsRaw, email_column);

            if (recipients.length === 0) {
                console.log(`No valid recipients found for campaign: ${campaign_name}`);
                await supabase
                    .from('campaigns')
                    .update({ status: 'scheduled' })
                    .eq('id', id);
                return;
            }

            // Create transporter
            const transporter = createTransporter({
                smtpServer: process.env.SMTP_HOST,
                smtpPort: 587,
                emailUser: process.env.EMAIL_USER,
                emailPass: process.env.EMAIL_PASS,
                delayBetweenEmails: delay_between_emails
            });

            // Create job info
            const jobId = `scheduled-campaign-${id}-${Date.now()}`;
            const jobInfo = {
                id: jobId,
                campaignId: id,
                total: recipients.length,
                sentEmails: 0,
                failedEmails: 0,
                shouldStop: false,
                completed: false,
                startedAt: new Date(),
                isScheduled: true
            };

            this.activeSendingJobs.set(jobId, jobInfo);

            // Start sending emails
            sendEmailsJob({
                jobId,
                recipients,
                emailColumn: email_column,
                nameColumn: name_column,
                subjectLine: subject_line,
                senderName: sender_name,
                templateContent: template,
                variables: Array.isArray(variables) ? variables : JSON.parse(variables || '[]'),
                transporter,
                delayBetweenEmails: parseInt(delay_between_emails),
                activeSendingJobs: this.activeSendingJobs,
                uploadsPath: './uploads/images/'
            }).then(async () => {
                // Update campaign status back to scheduled after completion
                await supabase
                    .from('campaigns')
                    .update({ 
                        status: 'scheduled',
                        execution_count: campaign.execution_count + 1
                    })
                    .eq('id', id);
                
                console.log(`Scheduled campaign ${campaign_name} completed successfully`);
            }).catch(async (error) => {
                console.error(`Error in scheduled campaign ${campaign_name}:`, error);
                await supabase
                    .from('campaigns')
                    .update({ 
                        status: 'scheduled',
                        last_error: error.message
                    })
                    .eq('id', id);
            });

        } catch (error) {
            console.error('Error executing scheduled campaign:', error);
            
            // Update campaign status back to scheduled on error
            await supabase
                .from('campaigns')
                .update({ 
                    status: 'scheduled',
                    last_error: error.message
                })
                .eq('id', campaign.id);
        }finally {
            // Clean up temporary Excel file
            if (tempExcelPath && fs.existsSync(tempExcelPath)) {
                try {
                    fs.unlinkSync(tempExcelPath);
                    console.log('Cleaned up temp Excel file:', tempExcelPath);
                } catch (cleanupError) {
                    console.error('Error cleaning up temp Excel file:', cleanupError);
                }
            }
        }
    }

    // Unschedule a campaign
    async unscheduleCampaign(campaignId) {
        try {
            // const numCampaignId = parseInt(campaignId);
            
            // if (isNaN(numCampaignId)) {
            //     throw new Error('Invalid campaign ID');
            // }

            // First, pause any active jobs
            // await this.pauseCampaign(numCampaignId);
             if (!campaignId || typeof campaignId !== 'string' || campaignId.trim() === '') {
            throw new Error(`Invalid campaign ID: ${campaignId}`);
        }
            if (this.scheduledJobs.has(campaignId)) {
                this.scheduledJobs.get(campaignId).destroy();
                this.scheduledJobs.delete(campaignId);
                 console.log(`Stopped scheduled job for campaign: ${campaignId}`);
            }

            // Update database
            await supabase
                .from('campaigns')
                .update({ 
                    is_scheduled: false,
                    status: 'draft',
                    schedule_pattern: null
                })
                .eq('id', campaignId);

            console.log(`Campaign ${campaignId} unscheduled`);
            return { success: true, message: 'Campaign unscheduled successfully' };

        } catch (error) {
            console.error('Error unscheduling campaign:', error);
            throw error;
        }
    }

     async pauseCampaign(campaignId) {
        try {
            const numCampaignId = parseInt(campaignId);
            
            // if (isNaN(numCampaignId)) {
            //     throw new Error('Invalid campaign ID');
            // }

            // Find and stop any active sending jobs for this campaign
            let jobsStopped = 0;
            for (const [jobId, jobInfo] of this.activeSendingJobs.entries()) {
                if (jobInfo.campaignId === numCampaignId) {
                    jobInfo.shouldStop = true;
                    jobsStopped++;
                    console.log(`Stopping active job ${jobId} for campaign ${numCampaignId}`);
                }
            }

            // Update campaign status to paused
            await supabase
                .from('campaigns')
                .update({ 
                    status: 'paused'
                })
                .eq('id', numCampaignId);

            console.log(`Campaign ${numCampaignId} paused. Stopped ${jobsStopped} active jobs.`);
            
            return { 
                success: true, 
                message: `Campaign paused successfully. Stopped ${jobsStopped} active jobs.`,
                jobsStopped 
            };

        } catch (error) {
            console.error('Error pausing campaign:', error);
            throw error;
        }
    }
    


    // Get schedule status
    getScheduleStatus(campaignId) {
        return {
            isScheduled: this.scheduledJobs.has(campaignId),
            jobExists: this.scheduledJobs.has(campaignId)
        };
    }

    // Get all scheduled campaigns
    getScheduledCampaigns() {
        return Array.from(this.scheduledJobs.keys());
    }

    // Validate cron pattern
    validateCronPattern(pattern) {
        try {
            const isValid = cron.validate(pattern);
            return { valid: isValid };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    // Get next execution times for a cron pattern
    getNextExecutions(pattern, count = 5) {
        try {
            const task = cron.schedule(pattern, () => {}, { scheduled: false });
            const executions = [];
            
            // This is a simplified approach - in production, you might want to use a proper cron parser
            return { success: true, executions: [`Next execution based on pattern: ${pattern}`] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Cleanup - destroy all scheduled jobs
    cleanup() {
        console.log('Cleaning up scheduled jobs...');
        for (const [id, job] of this.scheduledJobs) {
            job.destroy();
        }
        this.scheduledJobs.clear();
        console.log('All scheduled jobs cleaned up');
    }
}

// Export singleton instance
const campaignScheduler = new CampaignScheduler();
module.exports = campaignScheduler;

// Additional helper functions for common schedule patterns
const SchedulePatterns = {
    // Every minute (for testing)
    EVERY_MINUTE: '* * * * *',
    
    // Hourly
    EVERY_HOUR: '0 * * * *',
    EVERY_2_HOURS: '0 */2 * * *',
    EVERY_6_HOURS: '0 */6 * * *',
    EVERY_12_HOURS: '0 */12 * * *',
    
    // Daily
    DAILY_9AM: '0 9 * * *',
    DAILY_6PM: '0 18 * * *',
    DAILY_MIDNIGHT: '0 0 * * *',
    
    // Weekly
    WEEKLY_MONDAY_9AM: '0 9 * * 1',
    WEEKLY_FRIDAY_5PM: '0 17 * * 5',
    
    // Monthly
    MONTHLY_FIRST_9AM: '0 9 1 * *',
    MONTHLY_15TH_6PM: '0 18 15 * *'
};

module.exports.SchedulePatterns = SchedulePatterns;






// services/schedulerservice.js
// const cron = require('node-cron');
// const fs = require('fs');
// const path = require('path');
// const supabase = require('../config/supabase_client');
// const {
//     readExcelData,
//     getTemplateContent,
//     filterValidRecipients,
//     createTransporter,
//     sendEmailsJob
// } = require('./emailhelper');

// // Add the download function here or import it if it's in a separate module
// async function downloadFromCloudinaryToTemp(cloudinaryUrl, fileName) {
//     try {
//         const response = await fetch(cloudinaryUrl);
        
//         if (!response.ok) {
//             throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
//         }
        
//         // Use arrayBuffer() for newer fetch API
//         const buffer = Buffer.from(await response.arrayBuffer());
        
//         // Create temp directory if it doesn't exist
//         const tempDir = path.join(__dirname, '../temp');
//         if (!fs.existsSync(tempDir)) {
//             fs.mkdirSync(tempDir, { recursive: true });
//         }
        
//         // Create temp file path
//         const tempFilePath = path.join(tempDir, fileName);
        
//         // Write buffer to temp file
//         fs.writeFileSync(tempFilePath, buffer);
        
//         return tempFilePath;
//     } catch (error) {
//         throw new Error(`Failed to download file from Cloudinary: ${error.message}`);
//     }
// }

// class CampaignScheduler {
//     constructor() {
//         this.scheduledJobs = new Map(); // Store active cron jobs
//         this.activeSendingJobs = null; // Will be set from main app
//         this.init();
//     }

//     // Initialize scheduler - load existing scheduled campaigns
//     async init() {
//         try {
//             console.log('Initializing Campaign Scheduler...');
//             await this.loadScheduledCampaigns();
//             console.log('Campaign Scheduler initialized successfully');
//         } catch (error) {
//             console.error('Error initializing scheduler:', error);
//         }
//     }

//     // Set reference to active sending jobs from main app
//     setActiveSendingJobs(activeSendingJobs) {
//         this.activeSendingJobs = activeSendingJobs;
//     }

//     // Load and schedule existing campaigns from database
//     async loadScheduledCampaigns() {
//         try {
//             const { data: campaigns, error } = await supabase
//                 .from('campaigns')
//                 .select('*')
//                 .eq('is_scheduled', true)
//                 .eq('status', 'scheduled');

//             if (error) throw error;

//             for (const campaign of campaigns) {
//                 if (campaign.schedule_pattern) {
//                     await this.scheduleCampaign(campaign);
//                 }
//             }

//             console.log(`Loaded ${campaigns.length} scheduled campaigns`);
//         } catch (error) {
//             console.error('Error loading scheduled campaigns:', error);
//         }
//     }

//     // Schedule a campaign
//     async scheduleCampaign(campaign) {
//         try {
//             const { id, schedule_pattern, campaign_name } = campaign;
            
//             if (this.scheduledJobs.has(id)) {
//                 // If already scheduled, destroy existing job first
//                 this.scheduledJobs.get(id).destroy();
//             }

//             // Create cron job
//             const job = cron.schedule(schedule_pattern, async () => {
//                 console.log(`Executing scheduled campaign: ${campaign_name} (ID: ${id})`);
//                 await this.executeCampaign(campaign);
//             }, {
//                 scheduled: true,
//                 timezone: "Asia/Kolkata" // Adjust timezone as needed
//             });

//             this.scheduledJobs.set(id, job);
            
//             // Update campaign status in database
//             await supabase
//                 .from('campaigns')
//                 .update({ status: 'scheduled' })
//                 .eq('id', id);

//             console.log(`Campaign ${campaign_name} scheduled with pattern: ${schedule_pattern}`);
//             return { success: true, message: 'Campaign scheduled successfully' };

//         } catch (error) {
//             console.error('Error scheduling campaign:', error);
//             throw error;
//         }
//     }

//     // Execute a scheduled campaign
//     async executeCampaign(campaign) {
//         let tempExcelPath = null;
        
//         try {
//             const {
//                 id,
//                 excel_path,
//                 email_column,
//                 name_column,
//                 subject_line,
//                 smtp_server,
//                 smtp_port,
//                 email_user,
//                 email_pass,
//                 sender_name,
//                 variables,
//                 delay_between_emails,
//                 template,
//                 campaign_name
//             } = campaign;

//             console.log(`Starting scheduled execution of campaign: ${campaign_name}`);

//             // Update campaign status to sending
//             await supabase
//                 .from('campaigns')
//                 .update({ 
//                     status: 'sending',
//                     last_executed: new Date().toISOString()
//                 })
//                 .eq('id', id);

//             // Download Excel file from Cloudinary to temporary location
//             if (!excel_path) {
//                 throw new Error('Excel file path is missing from campaign data');
//             }

//             // console.log('Downloading Excel file from:', excel_path);
            
//             try {
//                 const excelFileName = `scheduled_excel_${id}_${Date.now()}.xlsx`;
//                 tempExcelPath = await downloadFromCloudinaryToTemp(excel_path, excelFileName);
//                 // console.log('Excel file downloaded to:', tempExcelPath);
//             } catch (downloadError) {
//                 // console.error('Failed to download Excel file:', downloadError);
//                 throw new Error(`Failed to download Excel file: ${downloadError.message}`);
//             }

//             // Read Excel data and filter recipients using the temporary file
//             const recipientsRaw = readExcelData(tempExcelPath);
//             const recipients = filterValidRecipients(recipientsRaw, email_column);

//             if (recipients.length === 0) {
//                 // console.log(`No valid recipients found for campaign: ${campaign_name}`);
//                 await supabase
//                     .from('campaigns')
//                     .update({ status: 'scheduled' })
//                     .eq('id', id);
//                 return;
//             }

//             // console.log(`Found ${recipients.length} valid recipients for campaign: ${campaign_name}`);

//             // Create transporter
//             const transporter = createTransporter({
//                 smtpServer: smtp_server || process.env.SMTP_HOST,
//                 smtpPort: smtp_port || 587,
//                 emailUser: email_user || process.env.EMAIL_USER,
//                 emailPass: email_pass || process.env.EMAIL_PASS,
//                 delayBetweenEmails: delay_between_emails || 2000
//             });

//             // Create job info
//             const jobId = `scheduled-campaign-${id}-${Date.now()}`;
//             const jobInfo = {
//                 id: jobId,
//                 campaignId: id,
//                 total: recipients.length,
//                 sentEmails: 0,
//                 failedEmails: 0,
//                 shouldStop: false,
//                 completed: false,
//                 startedAt: new Date(),
//                 isScheduled: true
//             };

//             this.activeSendingJobs.set(jobId, jobInfo);

//             // Start sending emails
//             sendEmailsJob({
//                 jobId,
//                 recipients,
//                 emailColumn: email_column,
//                 nameColumn: name_column,
//                 subjectLine: subject_line,
//                 senderName: sender_name,
//                 templateContent: template,
//                 variables: Array.isArray(variables) ? variables : JSON.parse(variables || '[]'),
//                 transporter,
//                 delayBetweenEmails: parseInt(delay_between_emails || 2000),
//                 activeSendingJobs: this.activeSendingJobs,
//                 uploadsPath: './uploads/images/',
//                 campaignId: id
//             }).then(async () => {
//                 // Update campaign status back to scheduled after completion
//                 await supabase
//                     .from('campaigns')
//                     .update({ 
//                         status: 'scheduled',
//                         execution_count: (campaign.execution_count || 0) + 1
//                     })
//                     .eq('id', id);
                
//                 console.log(`Scheduled campaign ${campaign_name} completed successfully`);
//             }).catch(async (error) => {
//                 console.error(`Error in scheduled campaign ${campaign_name}:`, error);
//                 await supabase
//                     .from('campaigns')
//                     .update({ 
//                         status: 'scheduled',
//                         last_error: error.message
//                     })
//                     .eq('id', id);
//             });

//         } catch (error) {
//             console.error('Error executing scheduled campaign:', error);
            
//             // Update campaign status back to scheduled on error
//             await supabase
//                 .from('campaigns')
//                 .update({ 
//                     status: 'scheduled',
//                     last_error: error.message
//                 })
//                 .eq('id', campaign.id);
//         } finally {
//             // Clean up temporary Excel file
//             if (tempExcelPath && fs.existsSync(tempExcelPath)) {
//                 try {
//                     fs.unlinkSync(tempExcelPath);
//                     console.log('Cleaned up temp Excel file:', tempExcelPath);
//                 } catch (cleanupError) {
//                     console.error('Error cleaning up temp Excel file:', cleanupError);
//                 }
//             }
//         }
//     }

//     // Unschedule a campaign
//     async unscheduleCampaign(campaignId) {
//         console.log(unschkh)
//         try {
//             if (!campaignId || typeof campaignId !== 'string' || campaignId.trim() === '') {
//                 throw new Error(`Invalid campaign ID: ${campaignId}`);
//             }
            
//             if (this.scheduledJobs.has(campaignId)) {
//                 this.scheduledJobs.get(campaignId).destroy();
//                 this.scheduledJobs.delete(campaignId);
//                 console.log(`Stopped scheduled job for campaign: ${campaignId}`);
//             }

//             // Update database
//             await supabase
//                 .from('campaigns')
//                 .update({ 
//                     is_scheduled: false,
//                     status: 'draft',
//                     schedule_pattern: null
//                 })
//                 .eq('id', campaignId);

//             console.log(`Campaign ${campaignId} unscheduled`);
//             return { success: true, message: 'Campaign unscheduled successfully' };

//         } catch (error) {
//             console.error('Error unscheduling campaign:', error);
//             throw error;
//         }
//     }

//     async pauseCampaign(campaignId) {
//         try {
//             const numCampaignId = parseInt(campaignId);
            
//             // Find and stop any active sending jobs for this campaign
//             let jobsStopped = 0;
//             for (const [jobId, jobInfo] of this.activeSendingJobs.entries()) {
//                 if (jobInfo.campaignId === numCampaignId) {
//                     jobInfo.shouldStop = true;
//                     jobsStopped++;
//                     console.log(`Stopping active job ${jobId} for campaign ${numCampaignId}`);
//                 }
//             }

//             // Update campaign status to paused
//             await supabase
//                 .from('campaigns')
//                 .update({ 
//                     status: 'paused'
//                 })
//                 .eq('id', numCampaignId);

//             console.log(`Campaign ${numCampaignId} paused. Stopped ${jobsStopped} active jobs.`);
            
//             return { 
//                 success: true, 
//                 message: `Campaign paused successfully. Stopped ${jobsStopped} active jobs.`,
//                 jobsStopped 
//             };

//         } catch (error) {
//             console.error('Error pausing campaign:', error);
//             throw error;
//         }
//     }

//     // Get schedule status
//     getScheduleStatus(campaignId) {
//         return {
//             isScheduled: this.scheduledJobs.has(campaignId),
//             jobExists: this.scheduledJobs.has(campaignId)
//         };
//     }

//     // Get all scheduled campaigns
//     getScheduledCampaigns() {
//         return Array.from(this.scheduledJobs.keys());
//     }

//     // Validate cron pattern
//     validateCronPattern(pattern) {
//         try {
//             const isValid = cron.validate(pattern);
//             return { valid: isValid };
//         } catch (error) {
//             return { valid: false, error: error.message };
//         }
//     }

//     // Get next execution times for a cron pattern
//     getNextExecutions(pattern, count = 5) {
//         try {
//             const task = cron.schedule(pattern, () => {}, { scheduled: false });
//             const executions = [];
            
//             // This is a simplified approach - in production, you might want to use a proper cron parser
//             return { success: true, executions: [`Next execution based on pattern: ${pattern}`] };
//         } catch (error) {
//             return { success: false, error: error.message };
//         }
//     }

//     // Cleanup - destroy all scheduled jobs
//     cleanup() {
//         console.log('Cleaning up scheduled jobs...');
//         for (const [id, job] of this.scheduledJobs) {
//             job.destroy();
//         }
//         this.scheduledJobs.clear();
//         console.log('All scheduled jobs cleaned up');
//     }
// }

// // Export singleton instance
// const campaignScheduler = new CampaignScheduler();
// module.exports = campaignScheduler;

// // Additional helper functions for common schedule patterns
// const SchedulePatterns = {
//     // Every minute (for testing)
//     EVERY_MINUTE: '* * * * *',
    
//     // Hourly
//     EVERY_HOUR: '0 * * * *',
//     EVERY_2_HOURS: '0 */2 * * *',
//     EVERY_6_HOURS: '0 */6 * * *',
//     EVERY_12_HOURS: '0 */12 * * *',
    
//     // Daily
//     DAILY_9AM: '0 9 * * *',
//     DAILY_6PM: '0 18 * * *',
//     DAILY_MIDNIGHT: '0 0 * * *',
    
//     // Weekly
//     WEEKLY_MONDAY_9AM: '0 9 * * 1',
//     WEEKLY_FRIDAY_5PM: '0 17 * * 5',
    
//     // Monthly
//     MONTHLY_FIRST_9AM: '0 9 1 * *',
//     MONTHLY_15TH_6PM: '0 18 15 * *'
// };

// module.exports.SchedulePatterns = SchedulePatterns;