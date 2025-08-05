
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

        const buffer = Buffer.from(await response.arrayBuffer());

        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const tempFilePath = path.join(tempDir, fileName);
        fs.writeFileSync(tempFilePath, buffer);

        return tempFilePath;
    } catch (error) {
        throw new Error(`Failed to download file from Cloudinary: ${error.message}`);
    }
}

class CampaignScheduler {
    constructor() {
        this.scheduledJobs = new Map(); // Store active cron jobs for recurring schedules
        this.oneTimeJobs = new Map(); // Store one-time scheduled jobs
        this.activeSendingJobs = null;
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Campaign Scheduler...');
            await this.loadScheduledCampaigns();
            await this.loadOneTimeSchedules();
            console.log('Campaign Scheduler initialized successfully');
        } catch (error) {
            console.error('Error initializing scheduler:', error);
        }
    }

    setActiveSendingJobs(activeSendingJobs) {
        this.activeSendingJobs = activeSendingJobs;
    }

    // Load recurring scheduled campaigns
    async loadScheduledCampaigns() {
        try {
            const { data: campaigns, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('is_scheduled', true)
                .eq('status', 'scheduled')
                .not('schedule_pattern', 'is', null);

            if (error) throw error;

            for (const campaign of campaigns) {
                if (campaign.schedule_pattern) {
                    await this.scheduleCampaign(campaign);
                }
            }

            console.log(`Loaded ${campaigns.length} recurring scheduled campaigns`);
        } catch (error) {
            console.error('Error loading scheduled campaigns:', error);
        }
    }

    // Load one-time scheduled campaigns
    async loadOneTimeSchedules() {
        try {
            const { data: campaigns, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('is_scheduled', true)
                .eq('status', 'scheduled')
                .not('scheduled_at', 'is', null);

            if (error) throw error;

            for (const campaign of campaigns) {
                if (campaign.scheduled_at) {
                    await this.scheduleOneTimeCampaign(campaign);
                }
            }

            console.log(`Loaded ${campaigns.length} one-time scheduled campaigns`);
        } catch (error) {
            console.error('Error loading one-time scheduled campaigns:', error);
        }
    }

    // Schedule a recurring campaign with cron pattern
    async scheduleCampaign(campaign) {
        try {
            const { id, schedule_pattern, campaign_name } = campaign;

            if (this.scheduledJobs.has(id)) {
                this.scheduledJobs.get(id).destroy();
            }

            const job = cron.schedule(schedule_pattern, async () => {
                console.log(`Executing scheduled campaign: ${campaign_name} (ID: ${id})`);
                await this.executeCampaign(campaign);
            }, {
                scheduled: true,
                timezone: "Asia/Kolkata"
            });

            this.scheduledJobs.set(id, job);

            console.log(`Scheduled recurring job for campaign ${campaign_name} with pattern: ${schedule_pattern}`);

            await supabase
                .from('campaigns')
                .update({ status: 'scheduled' })
                .eq('id', id);

            return { success: true, message: 'Campaign scheduled successfully' };

        } catch (error) {
            console.error('Error scheduling campaign:', error);
            throw error;
        }
    }

    // Schedule a one-time campaign for specific date/time
    async scheduleOneTimeCampaign(campaign) {
        try {
            // Validate required fields
            if (!campaign.scheduled_at) {
                throw new Error('No scheduled_at time provided');
            }

            // Extract campaign details with proper destructuring
            const { id, scheduled_at, name: campaign_name } = campaign;

            if (!id) {
                throw new Error('Campaign ID is required');
            }

            // Parse and validate the scheduled date
            const scheduledDate = new Date(scheduled_at);

            // Check if date is valid
            if (isNaN(scheduledDate.getTime())) {
                console.error('Invalid scheduled_at date:', scheduled_at);
                throw new Error('Invalid scheduled_at date format');
            }

            // Get current time for comparison
            const now = new Date();

            console.log('Scheduling campaign for:', scheduledDate.toISOString());
            console.log('Current time:', now.toISOString());

            // Check if scheduled time is in the future
            if (scheduledDate <= now) {
                console.warn(`Scheduled time ${scheduledDate.toISOString()} is in the past for campaign ${campaign_name}`);

                // Update database to mark as failed
                await supabase
                    .from('campaigns')
                    .update({
                        status: 'draft',
                        is_scheduled: false,
                        scheduled_at: null
                    })
                    .eq('id', id);

                return { success: false, message: 'Scheduled time is in the past' };
            }

            // Calculate delay until execution
            const delay = scheduledDate.getTime() - now.getTime();
            console.log(`Campaign will execute in ${Math.round(delay / 1000)} seconds`);

            // Clear existing timeout if any
            if (this.oneTimeJobs.has(id)) {
                console.log(`Clearing existing timeout for campaign ${id}`);
                clearTimeout(this.oneTimeJobs.get(id));
            }

            // Set timeout for execution
            const timeoutId = setTimeout(async () => {
                try {
                    console.log(`Executing one-time scheduled campaign: ${campaign_name} (ID: ${id})`);

                    // Execute the campaign
                    await this.executeCampaign(campaign);

                    // Clean up after execution
                    this.oneTimeJobs.delete(id);

                    // Update campaign status to completed
                    await supabase
                        .from('campaigns')
                        .update({
                            status: 'completed',
                            is_scheduled: false,
                            // scheduled_at: null
                        })
                        .eq('id', id);

                    console.log(`Campaign ${campaign_name} executed successfully`);

                } catch (executionError) {
                    console.error(`Error executing campaign ${campaign_name}:`, executionError);

                    // Update status to failed
                    await supabase
                        .from('campaigns')
                        .update({
                            status: 'failed',
                            is_scheduled: false
                        })
                        .eq('id', id);

                    // Clean up
                    this.oneTimeJobs.delete(id);
                }
            }, delay);

            // Store the timeout ID
            this.oneTimeJobs.set(id, timeoutId);

            console.log(`Scheduled one-time campaign ${campaign_name} for ${scheduledDate.toISOString()}`);

            // Update campaign status to scheduled
            await supabase
                .from('campaigns')
                .update({
                    status: 'scheduled', is_scheduled: true,
                    scheduled_at: scheduledDate.toISOString()
                })
                .eq('id', id);

            return {
                success: true,
                message: `Campaign scheduled for ${scheduledDate.toISOString()}`,
                scheduledFor: scheduledDate.toISOString(),
                delayMs: delay
            };

        } catch (error) {
            console.error('Error scheduling one-time campaign:', error);
            throw error;
        }
    }

    // Schedule campaign from calendar picker
    async scheduleFromCalendar(campaignId, dateTime, timezone = 'Asia/Kolkata') {
        try {
            const { data: campaign, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('id', campaignId)
                .single();

            if (error) throw error;
            if (!campaign) throw new Error('Campaign not found');

            console.log('Received dateTime:', dateTime, 'Type:', typeof dateTime);

            // Convert to proper datetime format
            // const scheduledDate = new Date(dateTime);

            let scheduledDate;

            if (typeof dateTime === 'string') {
                // Try to parse the string
                scheduledDate = new Date(dateTime);
            } else if (dateTime instanceof Date) {
                scheduledDate = dateTime;
            } else {
                throw new Error('Invalid dateTime format');
            }

            // Check if the date is valid
            if (isNaN(scheduledDate.getTime())) {
                console.error('Invalid date created from:', dateTime);
                throw new Error('Invalid date format provided');
            }

            console.log('Parsed scheduled date:', scheduledDate);
            console.log('Scheduled date ISO:', scheduledDate.toISOString());

            // Validate future date
            // if (scheduledDate <= new Date()) {
            //     throw new Error('Scheduled time must be in the future');
            // }
            // Validate future date
            const now = new Date();
            console.log('Current time:', now.toISOString());

            if (scheduledDate <= now) {
                throw new Error('Scheduled time must be in the future');
            }

            // Update campaign in database
            await supabase
                .from('campaigns')
                .update({
                    is_scheduled: true,
                    scheduled_at: scheduledDate.toISOString(),
                    schedule_pattern: null, // Clear any existing cron pattern
                    status: 'scheduled',
                    timezone: timezone
                })
                .eq('id', campaignId);

            // Schedule the campaign
            const updatedCampaign = {
                ...campaign,
                scheduled_at: scheduledDate.toISOString(),
                timezone: timezone,
                is_scheduled: true
            };

            return await this.scheduleOneTimeCampaign(updatedCampaign);

        } catch (error) {
            console.error('Error scheduling campaign from calendar:', error);
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

            console.log(`Starting execution of campaign: ${campaign_name}`);
// Get current counts before execution (for accumulation)
        const { data: currentCampaign, error: fetchError } = await supabase
            .from('campaigns')
            .select('emails_sent, emails_failed, total_recipients, execution_count')
            .eq('id', id)
            .single();
            if (fetchError) {
            console.error('Error fetching current campaign data:', fetchError);
            throw new Error(`Failed to fetch campaign data: ${fetchError.message}`);
        }

        const currentEmailsSent = currentCampaign?.emails_sent || 0;
        const currentEmailsFailed = currentCampaign?.emails_failed || 0;
        const currentExecutionCount = currentCampaign?.execution_count || 0;

            await supabase
                .from('campaigns')
                .update({
                    status: 'sending',
                    last_executed: new Date().toISOString(),
                    emails_sent: 0, // Reset for new execution
                emails_failed: 0 
                })
                .eq('id', id);

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
                    .update({
                        status: campaign.schedule_pattern ? 'scheduled' : 'completed',
                         total_recipients: Math.max(currentCampaign?.total_recipients || 0, 0)
                    
                    })
                    .eq('id', id);
                return;
            }

            const newTotalRecipients = (currentCampaign?.total_recipients || 0) + recipients.length;

            // Update total recipients count
        await supabase
            .from('campaigns')
            .update({
                total_recipients: newTotalRecipients
            })
            .eq('id', id);

            const transporter = createTransporter({
                smtpServer: process.env.SMTP_HOST,
                smtpPort: 587,
                emailUser: process.env.EMAIL_USER,
                emailPass: process.env.EMAIL_PASS,
                delayBetweenEmails: delay_between_emails
            });

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

            sendEmailsJob({
                jobId,
                recipients,
                emailUser: email_user,
                emailColumn: email_column,
                nameColumn: name_column,
                subjectLine: subject_line,
                senderName: sender_name,
                templateContent: template,
                variables: Array.isArray(variables) ? variables : JSON.parse(variables || '[]'),
                transporter,
                delayBetweenEmails: parseInt(delay_between_emails),
                activeSendingJobs: this.activeSendingJobs,
                uploadsPath: './uploads/images/',
                campaignId: id
            }).then(async () => {
                // Get final counts from the job data
           // Get final counts from the job data (current execution only)
            const finalJobData = this.activeSendingJobs.get(jobId);
            const currentExecutionSent = finalJobData ? finalJobData.sentEmails : 0;
            const currentExecutionFailed = finalJobData ? finalJobData.failedEmails : 0;

            // Calculate accumulated totals
            const totalSentEmails = currentEmailsSent + currentExecutionSent;
            const totalFailedEmails = currentEmailsFailed + currentExecutionFailed;

                const newStatus = campaign.schedule_pattern ? 'scheduled' : 'completed';
                await supabase
                    .from('campaigns')
                    .update({
                        status: newStatus,
                        execution_count: (campaign.execution_count || 0) + 1,
                        completed_at: new Date().toISOString(),
                    // Final counts should already be updated by sendEmailsJob, but ensure they're correct
                    emails_sent: totalSentEmails,
                    emails_failed: totalFailedEmails
                    })
                    .eq('id', id);


                if (campaign.smtp_server) {
                    // const sentCount = recipients.length;
                    const { data: existingUser, error: fetchError } = await supabase
                        .from('users')
                        .select('total_sent_emails')
                        .eq('id', campaign.smtp_server)
                        .single();

                    if (!fetchError && existingUser) {
                        const newTotal = (existingUser.total_sent_emails || 0) + currentExecutionSent;

                        await supabase
                            .from('users')
                            .update({ total_sent_emails: newTotal })
                            .eq('id', campaign.smtp_server);

                        console.log(`Updated sent count for user ${campaign.smtp_server}: +${currentExecutionSent}`);
                    } else {
                        console.warn('User not found or error fetching user data while updating sent count.');
                    }
                }

                console.log(`Campaign ${campaign_name} completed successfully`);
                // Clean up job data
            this.activeSendingJobs.delete(jobId);
            }).catch(async (error) => {
                console.error(`Error in campaign ${campaign_name}:`, error);
                // Get current counts even if there was an error
            const currentJobData = this.activeSendingJobs.get(jobId);
            const sentCount = currentJobData ? currentJobData.sentEmails : 0;
            const failedCount = currentJobData ? currentJobData.failedEmails : 0;
            // Calculate accumulated totals even on error
            const totalSentEmails = currentEmailsSent + currentExecutionSent;
            const totalFailedEmails = currentEmailsFailed + currentExecutionFailed;    
            
            await supabase
                    .from('campaigns')
                    .update({
                        status: campaign.schedule_pattern ? 'scheduled' : 'failed',
                        last_error: error.message,
                        emails_sent: totalSentEmails, // Use accumulated counts
                    emails_failed: totalFailedEmails,
                    })
                    .eq('id', id);

                    if (campaign.smtp_server &&  currentExecutionSent > 0) {
                try {
                    const { data: existingUser, error: fetchError } = await supabase
                        .from('users')
                        .select('total_sent_emails')
                        .eq('id', campaign.smtp_server)
                        .single();

                    if (!fetchError && existingUser) {
                        const newTotal = (existingUser.total_sent_emails || 0) + currentExecutionSent;

                        await supabase
                            .from('users')
                            .update({ total_sent_emails: newTotal })
                            .eq('id', campaign.smtp_server);

                        console.log(`Updated sent count for user ${campaign.smtp_server} despite error: +${sentCount}`);
                    }
                } catch (userUpdateError) {
                    console.error('Error updating user sent count after campaign failure:', userUpdateError);
                }
            }
             // Clean up job data
            this.activeSendingJobs.delete(jobId);
            });

        } catch (error) {
            console.error('Error executing scheduled campaign:', error);

            await supabase
                .from('campaigns')
                .update({
                    status: campaign.schedule_pattern ? 'scheduled' : 'failed',
                    last_error: error.message
                })
                .eq('id', campaign.id);
        } finally {
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

    // Unschedule a campaign (both recurring and one-time)
    async unscheduleCampaign(campaignId) {
        try {
            if (!campaignId || typeof campaignId !== 'string' || campaignId.trim() === '') {
                throw new Error(`Invalid campaign ID: ${campaignId}`);
            }

            // Clear recurring job
            if (this.scheduledJobs.has(campaignId)) {
                this.scheduledJobs.get(campaignId).destroy();
                this.scheduledJobs.delete(campaignId);
                console.log(`Stopped recurring job for campaign: ${campaignId}`);
            }

            // Clear one-time job
            if (this.oneTimeJobs.has(campaignId)) {
                clearTimeout(this.oneTimeJobs.get(campaignId));
                this.oneTimeJobs.delete(campaignId);
                console.log(`Stopped one-time job for campaign: ${campaignId}`);
            }

            // Update database
            await supabase
                .from('campaigns')
                .update({
                    is_scheduled: false,
                    status: 'draft',
                    schedule_pattern: null,
                    scheduled_at: null
                })
                .eq('id', campaignId);

            console.log(`Campaign ${campaignId} unscheduled`);
            return { success: true, message: 'Campaign unscheduled successfully' };

        } catch (error) {
            console.error('Error unscheduling campaign:', error);
            throw error;
        }
    }

    // Pause a campaign
    async pauseCampaign(campaignId) {
        try {
            const numCampaignId = parseInt(campaignId);

            let jobsStopped = 0;
            for (const [jobId, jobInfo] of this.activeSendingJobs.entries()) {
                if (jobInfo.campaignId === numCampaignId) {
                    jobInfo.shouldStop = true;
                    jobsStopped++;
                    console.log(`Stopping active job ${jobId} for campaign ${numCampaignId}`);
                }
            }

            await supabase
                .from('campaigns')
                .update({ status: 'paused' })
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
            isRecurringScheduled: this.scheduledJobs.has(campaignId),
            isOneTimeScheduled: this.oneTimeJobs.has(campaignId),
            isScheduled: this.scheduledJobs.has(campaignId) || this.oneTimeJobs.has(campaignId)
        };
    }

    // Get all scheduled campaigns
    getAllScheduledCampaigns() {
        return {
            recurring: Array.from(this.scheduledJobs.keys()),
            oneTime: Array.from(this.oneTimeJobs.keys())
        };
    }

    // Get next scheduled executions for a campaign
    async getNextExecutions(campaignId) {
        try {
            const { data: campaign, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('id', campaignId)
                .single();

            if (error) throw error;
            if (!campaign) throw new Error('Campaign not found');

            if (campaign.scheduled_at) {
                // One-time schedule
                return {
                    type: 'one-time',
                    next: campaign.scheduled_at,
                    executions: [campaign.scheduled_at]
                };
            } else if (campaign.schedule_pattern) {
                // Recurring schedule
                return {
                    type: 'recurring',
                    pattern: campaign.schedule_pattern,
                    executions: [`Next execution based on pattern: ${campaign.schedule_pattern}`]
                };
            }

            return { type: 'none', executions: [] };

        } catch (error) {
            console.error('Error getting next executions:', error);
            throw error;
        }
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

    // Validate datetime
    validateDateTime(dateTime) {
        try {
            const date = new Date(dateTime);
            const now = new Date();

            if (isNaN(date.getTime())) {
                return { valid: false, error: 'Invalid date format' };
            }

            if (date <= now) {
                return { valid: false, error: 'Date must be in the future' };
            }

            return { valid: true };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    // Cleanup - destroy all scheduled jobs
    cleanup() {
        console.log('Cleaning up scheduled jobs...');

        // Clean up recurring jobs
        for (const [id, job] of this.scheduledJobs) {
            job.destroy();
        }
        this.scheduledJobs.clear();

        // Clean up one-time jobs
        for (const [id, timeoutId] of this.oneTimeJobs) {
            clearTimeout(timeoutId);
        }
        this.oneTimeJobs.clear();

        console.log('All scheduled jobs cleaned up');
    }
}

// Export singleton instance
const campaignScheduler = new CampaignScheduler();
module.exports = campaignScheduler;

// Common schedule patterns
const SchedulePatterns = {
    EVERY_MINUTE: '* * * * *',
    EVERY_HOUR: '0 * * * *',
    EVERY_2_HOURS: '0 */2 * * *',
    EVERY_6_HOURS: '0 */6 * * *',
    EVERY_12_HOURS: '0 */12 * * *',
    DAILY_9AM: '0 9 * * *',
    DAILY_6PM: '0 18 * * *',
    DAILY_MIDNIGHT: '0 0 * * *',
    WEEKLY_MONDAY_9AM: '0 9 * * 1',
    WEEKLY_FRIDAY_5PM: '0 17 * * 5',
    MONTHLY_FIRST_9AM: '0 9 1 * *',
    MONTHLY_15TH_6PM: '0 18 15 * *'
};

module.exports.SchedulePatterns = SchedulePatterns;