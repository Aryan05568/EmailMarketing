// // routes/analytics.js
// const express = require('express');
// const axios = require('axios');
// const router = express.Router();

// // Configuration
// const ELASTIC_EMAIL_API_KEY = process.env.ELASTIC_EMAIL_API_KEY;
// const ELASTIC_EMAIL_API_URL = 'https://api.elasticemail.com/v2';

// // Helper functions
// function getPerformanceStatus(deliveryRate, openRate, clickRate) {
//     if (deliveryRate >= 95 && openRate >= 20 && clickRate >= 3) {
//         return 'excellent';
//     } else if (deliveryRate >= 90 && openRate >= 15 && clickRate >= 2) {
//         return 'good';
//     } else if (deliveryRate >= 85 && openRate >= 10 && clickRate >= 1) {
//         return 'average';
//     } else {
//         return 'poor';
//     }
// }

// function getPerformanceRecommendations(deliveryRate, openRate, clickRate, bounceRate) {
//     const recommendations = [];
    
//     if (deliveryRate < 90) {
//         recommendations.push('Improve list hygiene to increase delivery rate');
//     }
//     if (bounceRate > 5) {
//         recommendations.push('Clean your email list to reduce bounce rate');
//     }
//     if (openRate < 15) {
//         recommendations.push('Optimize subject lines to improve open rates');
//     }
//     if (clickRate < 2) {
//         recommendations.push('Improve email content and call-to-action buttons');
//     }
    
//     return recommendations;
// }

// function getAccountHealthStatus(deliveryRate, bounceRate, complaints, delivered) {
//     const complaintRate = delivered > 0 ? (complaints / delivered) * 100 : 0;
    
//     if (deliveryRate >= 95 && bounceRate <= 2 && complaintRate <= 0.1) {
//         return 'excellent';
//     } else if (deliveryRate >= 90 && bounceRate <= 5 && complaintRate <= 0.3) {
//         return 'good';
//     } else if (deliveryRate >= 85 && bounceRate <= 8 && complaintRate <= 0.5) {
//         return 'warning';
//     } else {
//         return 'critical';
//     }
// }

// function calculateReputationScore(deliveryRate, bounceRate, complaints, delivered) {
//     const complaintRate = delivered > 0 ? (complaints / delivered) * 100 : 0;
    
//     let score = 100;
//     score -= (100 - deliveryRate) * 2; // Delivery rate impact
//     score -= bounceRate * 5; // Bounce rate impact
//     score -= complaintRate * 20; // Complaint rate impact
    
//     return Math.max(0, Math.min(100, Math.round(score)));
// }

// function getAccountRecommendations(deliveryRate, bounceRate, complaints, delivered) {
//     const recommendations = [];
//     const complaintRate = delivered > 0 ? (complaints / delivered) * 100 : 0;
    
//     if (deliveryRate < 90) {
//         recommendations.push('Focus on improving email deliverability');
//     }
//     if (bounceRate > 5) {
//         recommendations.push('Implement regular list cleaning');
//     }
//     if (complaintRate > 0.3) {
//         recommendations.push('Review email content and frequency');
//     }
//     if (delivered === 0) {
//         recommendations.push('Start sending emails to build reputation');
//     }
    
//     return recommendations;
// }

// // Get specific campaign analytics
// router.get('/campaign/:campaignName', async (req, res) => {
//     try {
//         const { campaignName } = req.params;
//         const { startDate, endDate } = req.query;
        
//         // Validate required parameters
//         if (!campaignName) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Campaign name is required'
//             });
//         }
        
//         // Set default date range if not provided (last 30 days)
//         const end = endDate ? new Date(endDate) : new Date();
//         const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
//         const params = new URLSearchParams({
//             apikey: ELASTIC_EMAIL_API_KEY,
//             from: start.toISOString().split('T')[0],
//             to: end.toISOString().split('T')[0],
//             channel: `campaign_${campaignName}`
//         });

//         const response = await axios.get(`${ELASTIC_EMAIL_API_URL}/log/summary?${params}`);

//         console.log(response)
        
//         if (response.data.success) {
//             const data = response.data.data;
            
//             // Calculate additional metrics
//             const deliveryRate = data.sent > 0 ? ((data.delivered / data.sent) * 100).toFixed(2) : 0;
//             const openRate = data.delivered > 0 ? ((data.opened / data.delivered) * 100).toFixed(2) : 0;
//             const clickRate = data.delivered > 0 ? ((data.clicked / data.delivered) * 100).toFixed(2) : 0;
//             const bounceRate = data.sent > 0 ? ((data.bounced / data.sent) * 100).toFixed(2) : 0;
//             const unsubscribeRate = data.delivered > 0 ? ((data.unsubscribed / data.delivered) * 100).toFixed(2) : 0;

//             res.json({
//                 success: true,
//                 campaign: campaignName,
//                 period: {
//                     from: start.toISOString().split('T')[0],
//                     to: end.toISOString().split('T')[0]
//                 },
//                 metrics: {
//                     // Raw numbers
//                     sent: data.sent || 0,
//                     delivered: data.delivered || 0,
//                     opened: data.opened || 0,
//                     clicked: data.clicked || 0,
//                     bounced: data.bounced || 0,
//                     unsubscribed: data.unsubscribed || 0,
//                     complaints: data.complaints || 0,
                    
//                     // Calculated rates
//                     deliveryRate: parseFloat(deliveryRate),
//                     openRate: parseFloat(openRate),
//                     clickRate: parseFloat(clickRate),
//                     bounceRate: parseFloat(bounceRate),
//                     unsubscribeRate: parseFloat(unsubscribeRate),
                    
//                     // Click-to-open rate
//                     clickToOpenRate: data.opened > 0 ? parseFloat(((data.clicked / data.opened) * 100).toFixed(2)) : 0
//                 },
//                 // Performance indicators
//                 performance: {
//                     status: getPerformanceStatus(parseFloat(deliveryRate), parseFloat(openRate), parseFloat(clickRate)),
//                     recommendations: getPerformanceRecommendations(parseFloat(deliveryRate), parseFloat(openRate), parseFloat(clickRate), parseFloat(bounceRate))
//                 }
//             });
//         } else {
//             throw new Error('Failed to fetch campaign analytics from Elastic Email');
//         }
//     } catch (error) {
//         console.error('Error getting specific campaign analytics:', error);
//         res.status(500).json({
//             success: false,
//             error: error.message,
//             campaign: req.params.campaignName
//         });
//     }
// });

// // Get overall account analytics
// router.get('/overall', async (req, res) => {
//     try {
//         const { startDate, endDate, includeChannels } = req.query;
        
//         // Set default date range if not provided (last 30 days)
//         const end = endDate ? new Date(endDate) : new Date();
//         const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
//         const params = new URLSearchParams({
//             apikey: ELASTIC_EMAIL_API_KEY,
//             from: start.toISOString().split('T')[0],
//             to: end.toISOString().split('T')[0]
//         });

//         const response = await axios.get(`${ELASTIC_EMAIL_API_URL}/log/summary?${params}`);

//         console.log(response)
        
//         if (response.data.success) {
//             const data = response.data.data;
            
//             // Calculate overall metrics
//             const deliveryRate = data.sent > 0 ? ((data.delivered / data.sent) * 100).toFixed(2) : 0;
//             const openRate = data.delivered > 0 ? ((data.opened / data.delivered) * 100).toFixed(2) : 0;
//             const clickRate = data.delivered > 0 ? ((data.clicked / data.delivered) * 100).toFixed(2) : 0;
//             const bounceRate = data.sent > 0 ? ((data.bounced / data.sent) * 100).toFixed(2) : 0;

//             const analytics = {
//                 success: true,
//                 period: {
//                     from: start.toISOString().split('T')[0],
//                     to: end.toISOString().split('T')[0]
//                 },
//                 overall: {
//                     // Raw numbers
//                     sent: data.sent || 0,
//                     delivered: data.delivered || 0,
//                     opened: data.opened || 0,
//                     clicked: data.clicked || 0,
//                     bounced: data.bounced || 0,
//                     unsubscribed: data.unsubscribed || 0,
//                     complaints: data.complaints || 0,
                    
//                     // Calculated rates
//                     deliveryRate: parseFloat(deliveryRate),
//                     openRate: parseFloat(openRate),
//                     clickRate: parseFloat(clickRate),
//                     bounceRate: parseFloat(bounceRate),
//                     unsubscribeRate: data.delivered > 0 ? parseFloat(((data.unsubscribed / data.delivered) * 100).toFixed(2)) : 0,
//                     complaintRate: data.delivered > 0 ? parseFloat(((data.complaints / data.delivered) * 100).toFixed(2)) : 0,
                    
//                     // Advanced metrics
//                     clickToOpenRate: data.opened > 0 ? parseFloat(((data.clicked / data.opened) * 100).toFixed(2)) : 0,
//                     engagementRate: data.delivered > 0 ? parseFloat((((data.opened + data.clicked) / data.delivered) * 100).toFixed(2)) : 0
//                 },
//                 // Account health indicators
//                 accountHealth: {
//                     status: getAccountHealthStatus(parseFloat(deliveryRate), parseFloat(bounceRate), data.complaints, data.delivered),
//                     reputationScore: calculateReputationScore(parseFloat(deliveryRate), parseFloat(bounceRate), data.complaints, data.delivered),
//                     recommendations: getAccountRecommendations(parseFloat(deliveryRate), parseFloat(bounceRate), data.complaints, data.delivered)
//                 }
//             };

//             res.json(analytics);
//         } else {
//             throw new Error('Failed to fetch overall analytics from Elastic Email');
//         }
//     } catch (error) {
//         console.error('Error getting overall analytics:', error);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// // Get analytics for multiple campaigns
// router.post('/campaigns', async (req, res) => {
//     try {
//         const { campaigns, startDate, endDate } = req.body;
        
//         if (!campaigns || !Array.isArray(campaigns) || campaigns.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Campaigns array is required'
//             });
//         }
        
//         // Set default date range if not provided (last 30 days)
//         const end = endDate ? new Date(endDate) : new Date();
//         const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
//         const campaignAnalytics = await Promise.all(
//             campaigns.map(async (campaignName) => {
//                 try {
//                     const params = new URLSearchParams({
//                         apikey: ELASTIC_EMAIL_API_KEY,
//                         from: start.toISOString().split('T')[0],
//                         to: end.toISOString().split('T')[0],
//                         channel: `campaign_${campaignName}`
//                     });

//                     const response = await axios.get(`${ELASTIC_EMAIL_API_URL}/log/summary?${params}`);
//                     console.log(response +"26")
                    
//                     if (response.data.success) {
//                         const data = response.data.logstatussummary;
//                         console.log(data)
                        
//                         // const deliveryRate = data.sent > 0 ? ((data.delivered / data.sent) * 100).toFixed(2) : 0;
//                         const openRate = data?.delivered > 0 ? ((data?.opened / data?.delivered) * 100).toFixed(2) : 0;
//                         const clickRate = data?.delivered > 0 ? ((data?.clicked / data?.delivered) * 100).toFixed(2) : 0;

//                         return {
//                             campaign: campaignName,
//                             success: true,
//                             metrics: {
//                                 // sent: data.sent || 0,
//                                 delivered: data.delivered || 0,
//                                 opened: data.opened || 0,
//                                 clicked: data.clicked || 0,
//                                 deliveryRate: parseFloat(deliveryRate),
//                                 openRate: parseFloat(openRate),
//                                 clickRate: parseFloat(clickRate)
//                             }
//                         };
//                     } else {
//                         return {
//                             campaign: campaignName,
//                             success: false,
//                             error: 'Failed to fetch data'
//                         };
//                     }
//                 } catch (error) {
//                     return {
//                         campaign: campaignName,
//                         success: false,
//                         error: error.message
//                     };
//                 }
//             })
//         );
        
//         res.json({
//             success: true,
//             period: {
//                 from: start.toISOString().split('T')[0],
//                 to: end.toISOString().split('T')[0]
//             },
//             campaigns: campaignAnalytics
//         });
//     } catch (error) {
//         console.error('Error getting multiple campaign analytics:', error);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// // Get analytics summary for dashboard
// router.get('/dashboard', async (req, res) => {
//     try {
//         const { days = 30 } = req.query;
        
//         const end = new Date();
//         const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        
//         const params = new URLSearchParams({
//             apikey: ELASTIC_EMAIL_API_KEY,
//             from: start.toISOString().split('T')[0],
//             to: end.toISOString().split('T')[0]
//         });

//         const response = await axios.get(`${ELASTIC_EMAIL_API_URL}/log/summary?${params}`);
//         console.log(response)
        
//         if (response.data.success) {
//             const data = response.data.data;
            
//             const openRate = data.delivered > 0 ? ((data.opened / data.delivered) * 100).toFixed(1) : 0;
//             const clickRate = data.delivered > 0 ? ((data.clicked / data.delivered) * 100).toFixed(1) : 0;
//             const deliveryRate = data.sent > 0 ? ((data.delivered / data.sent) * 100).toFixed(1) : 0;
            
//             res.json({
//                 success: true,
//                 period: {
//                     from: start.toISOString().split('T')[0],
//                     to: end.toISOString().split('T')[0],
//                     days: parseInt(days)
//                 },
//                 summary: {
//                     totalSent: data.sent || 0,
//                     totalDelivered: data.delivered || 0,
//                     totalOpened: data.opened || 0,
//                     totalClicked: data.clicked || 0,
//                     openRate: parseFloat(openRate),
//                     clickRate: parseFloat(clickRate),
//                     deliveryRate: parseFloat(deliveryRate),
//                     engagementRate: data.delivered > 0 ? parseFloat((((data.opened + data.clicked) / data.delivered) * 100).toFixed(1)) : 0
//                 }
//             });
//         } else {
//             throw new Error('Failed to fetch dashboard analytics');
//         }
//     } catch (error) {
//         console.error('Error getting dashboard analytics:', error);
//         res.status(500).json({
//             success: false,
//             error: error.message,
//             summary: {
//                 totalSent: 0,
//                 totalDelivered: 0,
//                 totalOpened: 0,
//                 totalClicked: 0,
//                 openRate: 0,
//                 clickRate: 0,
//                 deliveryRate: 0,
//                 engagementRate: 0
//             }
//         });
//     }
// });

// module.exports = router;



// routes/analytics.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// Configuration
const ELASTIC_EMAIL_API_KEY = process.env.ELASTIC_EMAIL_API_KEY;
const ELASTIC_EMAIL_API_URL = 'https://api.elasticemail.com/v4';

// Helper functions
function getPerformanceStatus(deliveryRate, openRate, clickRate) {
    if (deliveryRate >= 95 && openRate >= 20 && clickRate >= 3) {
        return 'excellent';
    } else if (deliveryRate >= 90 && openRate >= 15 && clickRate >= 2) {
        return 'good';
    } else if (deliveryRate >= 85 && openRate >= 10 && clickRate >= 1) {
        return 'average';
    } else {
        return 'poor';
    }
}

function getPerformanceRecommendations(deliveryRate, openRate, clickRate, bounceRate) {
    const recommendations = [];
    
    if (deliveryRate < 90) {
        recommendations.push('Improve list hygiene to increase delivery rate');
    }
    if (bounceRate > 5) {
        recommendations.push('Clean your email list to reduce bounce rate');
    }
    if (openRate < 15) {
        recommendations.push('Optimize subject lines to improve open rates');
    }
    if (clickRate < 2) {
        recommendations.push('Improve email content and call-to-action buttons');
    }
    
    return recommendations;
}

function getAccountHealthStatus(deliveryRate, bounceRate, complaints, delivered) {
    const complaintRate = delivered > 0 ? (complaints / delivered) * 100 : 0;
    
    if (deliveryRate >= 95 && bounceRate <= 2 && complaintRate <= 0.1) {
        return 'excellent';
    } else if (deliveryRate >= 90 && bounceRate <= 5 && complaintRate <= 0.3) {
        return 'good';
    } else if (deliveryRate >= 85 && bounceRate <= 8 && complaintRate <= 0.5) {
        return 'warning';
    } else {
        return 'critical';
    }
}

function calculateReputationScore(deliveryRate, bounceRate, complaints, delivered) {
    const complaintRate = delivered > 0 ? (complaints / delivered) * 100 : 0;
    
    let score = 100;
    score -= (100 - deliveryRate) * 2; // Delivery rate impact
    score -= bounceRate * 5; // Bounce rate impact
    score -= complaintRate * 20; // Complaint rate impact
    
    return Math.max(0, Math.min(100, Math.round(score)));
}

function getAccountRecommendations(deliveryRate, bounceRate, complaints, delivered) {
    const recommendations = [];
    const complaintRate = delivered > 0 ? (complaints / delivered) * 100 : 0;
    
    if (deliveryRate < 90) {
        recommendations.push('Focus on improving email deliverability');
    }
    if (bounceRate > 5) {
        recommendations.push('Implement regular list cleaning');
    }
    if (complaintRate > 0.3) {
        recommendations.push('Review email content and frequency');
    }
    if (delivered === 0) {
        recommendations.push('Start sending emails to build reputation');
    }
    
    return recommendations;
}

// Get specific campaign analytics
router.get('/campaign/:campaignName', async (req, res) => {
    try {
        const { campaignName } = req.params;
        const { startDate, endDate } = req.query;
        
        // Validate required parameters
        if (!campaignName) {
            return res.status(400).json({
                success: false,
                error: 'Campaign name is required'
            });
        }
        
        // Set default date range if not provided (last 30 days)
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const params = new URLSearchParams({
            apikey: ELASTIC_EMAIL_API_KEY,
            from: start.toISOString().split('T')[0],
            to: end.toISOString().split('T')[0],
            channel: `campaign_${campaignName}`
        });

        const response = await axios.get(`${ELASTIC_EMAIL_API_URL}/log/summary?${params}`);
        
        if (response.data.success) {
            // FIX: Access the correct data path
            const data = response.data.data.logstatussummary;
            
            // FIX: Use emailtotal instead of sent
            const sent = data.emailtotal || 0;
            
            // Calculate additional metrics
            const deliveryRate = sent > 0 ? ((data.delivered / sent) * 100).toFixed(2) : 0;
            const openRate = data.delivered > 0 ? ((data.opened / data.delivered) * 100).toFixed(2) : 0;
            const clickRate = data.delivered > 0 ? ((data.clicked / data.delivered) * 100).toFixed(2) : 0;
            const bounceRate = sent > 0 ? ((data.bounced / sent) * 100).toFixed(2) : 0;
            const unsubscribeRate = data.delivered > 0 ? ((data.unsubscribed / data.delivered) * 100).toFixed(2) : 0;

            res.json({
                success: true,
                campaign: campaignName,
                period: {
                    from: start.toISOString().split('T')[0],
                    to: end.toISOString().split('T')[0]
                },
                metrics: {
                    // Raw numbers
                    sent: sent,
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
            });
        } else {
            throw new Error('Failed to fetch campaign analytics from Elastic Email');
        }
    } catch (error) {
        console.error('Error getting specific campaign analytics:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            campaign: req.params.campaignName
        });
    }
});

// Get overall account analytics


router.get('/overall', async (req, res) => {
    try {
        const { startDate, endDate, includeChannels } = req.query;
        
        // Set default date range if not provided (last 30 days)
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        // Use the correct Elastic Email API endpoint and authentication
        const params = new URLSearchParams({
            from: start.toISOString().split('T')[0],
            to: end.toISOString().split('T')[0]
        });

        // Option 1: Use API key in query parameters
        const response = await axios.get(`${ELASTIC_EMAIL_API_URL}/statistics?${params.toString()}&apikey=${ELASTIC_EMAIL_API_KEY}`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        // Option 2: Alternative using X-ElasticEmail-ApiKey header (uncomment if preferred)
        /*
        const response = await axios.get(`${ELASTIC_EMAIL_API_URL}/statistics?${params.toString()}`, {
            headers: {
                'X-ElasticEmail-ApiKey': ELASTIC_EMAIL_API_KEY,
                'Accept': 'application/json'
            }
        });
        */

        console.log('API Response:', response.data);

        const data = response.data;
        
        // Handle the response structure based on Elastic Email API documentation
        // The response structure may vary, so adjust these field names as needed
        const sent = (data.Delivered || 0) + (data.Bounced || 0) + (data.NotDelivered || 0);
        const delivered = data.Delivered || 0;
        const opened = data.Opened || 0;
        const clicked = data.Clicked || 0;
        const bounced = data.Bounced || 0;
        const complaints = data.Complaints || 0;
        const unsubscribed = data.Unsubscribed || 0;

        // Calculate rates
        const deliveryRate = sent > 0 ? ((delivered / sent) * 100).toFixed(2) : 0;
        const openRate = delivered > 0 ? ((opened / delivered) * 100).toFixed(2) : 0;
        const clickRate = delivered > 0 ? ((clicked / delivered) * 100).toFixed(2) : 0;
        const bounceRate = sent > 0 ? ((bounced / sent) * 100).toFixed(2) : 0;
        const unsubscribeRate = delivered > 0 ? ((unsubscribed / delivered) * 100).toFixed(2) : 0;
        const complaintRate = delivered > 0 ? ((complaints / delivered) * 100).toFixed(2) : 0;

        // Advanced metrics
        const clickToOpenRate = opened > 0 ? ((clicked / opened) * 100).toFixed(2) : 0;
        const engagementRate = delivered > 0 ? (((opened + clicked) / delivered) * 100).toFixed(2) : 0;

        res.json({
            success: true,
            period: {
                from: start.toISOString().split('T')[0],
                to: end.toISOString().split('T')[0]
            },
            overall: {
                // Raw numbers
                sent: sent,
                delivered: delivered,
                opened: opened,
                clicked: clicked,
                bounced: bounced,
                unsubscribed: unsubscribed,
                complaints: complaints,
                
                // Calculated rates
                deliveryRate: parseFloat(deliveryRate),
                openRate: parseFloat(openRate),
                clickRate: parseFloat(clickRate),
                bounceRate: parseFloat(bounceRate),
                unsubscribeRate: parseFloat(unsubscribeRate),
                complaintRate: parseFloat(complaintRate),
                
                // Advanced metrics
                clickToOpenRate: parseFloat(clickToOpenRate),
                engagementRate: parseFloat(engagementRate)
            },
            // Account health indicators
            accountHealth: {
                status: getAccountHealthStatus(parseFloat(deliveryRate), parseFloat(bounceRate), complaints, delivered),
                reputationScore: calculateReputationScore(parseFloat(deliveryRate), parseFloat(bounceRate), complaints, delivered),
                recommendations: getAccountRecommendations(parseFloat(deliveryRate), parseFloat(bounceRate), complaints, delivered)
            }
        });
        
    } catch (error) {
        console.error('Error getting overall analytics:', error);
        
        // Provide more detailed error information
        const errorResponse = {
            success: false,
            error: error.message,
            details: error.response ? {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            } : null
        };
        
        res.status(error.response?.status || 500).json(errorResponse);
    }
});

// Get analytics for multiple campaigns
router.post('/campaigns', async (req, res) => {
    try {
        const { campaigns, startDate, endDate } = req.body;
        
        if (!campaigns || !Array.isArray(campaigns) || campaigns.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Campaigns array is required'
            });
        }
        
        // Set default date range if not provided (last 30 days)
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const campaignAnalytics = await Promise.all(
            campaigns.map(async (campaignName) => {
                try {
                    const params = new URLSearchParams({
                        apikey: ELASTIC_EMAIL_API_KEY,
                        from: start.toISOString().split('T')[0],
                        to: end.toISOString().split('T')[0],
                        channel: `campaign_${campaignName}`
                    });

                    const response = await axios.get(`${ELASTIC_EMAIL_API_URL}/log/summary?${params}`);
                    
                    if (response.data.success) {
                        // FIX: Access the correct data path
                        const data = response.data.data.logstatussummary;
                        
                        // FIX: Use emailtotal instead of sent
                        const sent = data.emailtotal || 0;
                        
                        const deliveryRate = sent > 0 ? ((data.delivered / sent) * 100).toFixed(2) : 0;
                        const openRate = data.delivered > 0 ? ((data.opened / data.delivered) * 100).toFixed(2) : 0;
                        const clickRate = data.delivered > 0 ? ((data.clicked / data.delivered) * 100).toFixed(2) : 0;

                        return {
                            campaign: campaignName,
                            success: true,
                            metrics: {
                                sent: sent,
                                delivered: data.delivered || 0,
                                opened: data.opened || 0,
                                clicked: data.clicked || 0,
                                deliveryRate: parseFloat(deliveryRate),
                                openRate: parseFloat(openRate),
                                clickRate: parseFloat(clickRate)
                            }
                        };
                    } else {
                        return {
                            campaign: campaignName,
                            success: false,
                            error: 'Failed to fetch data'
                        };
                    }
                } catch (error) {
                    return {
                        campaign: campaignName,
                        success: false,
                        error: error.message
                    };
                }
            })
        );
        
        res.json({
            success: true,
            period: {
                from: start.toISOString().split('T')[0],
                to: end.toISOString().split('T')[0]
            },
            campaigns: campaignAnalytics
        });
    } catch (error) {
        console.error('Error getting multiple campaign analytics:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get analytics summary for dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const { days = 30 } = req.query;
        
        const end = new Date();
        const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        
        const params = new URLSearchParams({
            apikey: ELASTIC_EMAIL_API_KEY,
            from: start.toISOString().split('T')[0],
            to: end.toISOString().split('T')[0]
        });

        const response = await axios.get(`${ELASTIC_EMAIL_API_URL}/log/summary?${params}`);
        
        if (response.data.success) {
            // FIX: Access the correct data path
            const data = response.data.data.logstatussummary;
            
            // FIX: Use emailtotal instead of sent
            const sent = data.emailtotal || 0;
            
            const openRate = data.delivered > 0 ? ((data.opened / data.delivered) * 100).toFixed(1) : 0;
            const clickRate = data.delivered > 0 ? ((data.clicked / data.delivered) * 100).toFixed(1) : 0;
            const deliveryRate = sent > 0 ? ((data.delivered / sent) * 100).toFixed(1) : 0;
            
            res.json({
                success: true,
                period: {
                    from: start.toISOString().split('T')[0],
                    to: end.toISOString().split('T')[0],
                    days: parseInt(days)
                },
                summary: {
                    totalSent: sent,
                    totalDelivered: data.delivered || 0,
                    totalOpened: data.opened || 0,
                    totalClicked: data.clicked || 0,
                    openRate: parseFloat(openRate),
                    clickRate: parseFloat(clickRate),
                    deliveryRate: parseFloat(deliveryRate),
                    engagementRate: data.delivered > 0 ? parseFloat((((data.opened + data.clicked) / data.delivered) * 100).toFixed(1)) : 0
                }
            });
        } else {
            throw new Error('Failed to fetch dashboard analytics');
        }
    } catch (error) {
        console.error('Error getting dashboard analytics:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            summary: {
                totalSent: 0,
                totalDelivered: 0,
                totalOpened: 0,
                totalClicked: 0,
                openRate: 0,
                clickRate: 0,
                deliveryRate: 0,
                engagementRate: 0
            }
        });
    }
});

module.exports = router;




// const express = require('express');
// const axios = require('axios');
// const router = express.Router();

// // Configuration
// const ELASTIC_EMAIL_API_KEY = process.env.ELASTIC_EMAIL_API_KEY;
// const ELASTIC_EMAIL_API_URL = 'https://api.elasticemail.com/v4';

// // Helper functions
// function getPerformanceStatus(deliveryRate, openRate, clickRate) {
//     if (deliveryRate >= 95 && openRate >= 20 && clickRate >= 3) {
//         return 'excellent';
//     } else if (deliveryRate >= 90 && openRate >= 15 && clickRate >= 2) {
//         return 'good';
//     } else if (deliveryRate >= 85 && openRate >= 10 && clickRate >= 1) {
//         return 'average';
//     } else {
//         return 'poor';
//     }
// }

// function getPerformanceRecommendations(deliveryRate, openRate, clickRate, bounceRate) {
//     const recommendations = [];
    
//     if (deliveryRate < 90) {
//         recommendations.push('Improve list hygiene to increase delivery rate');
//     }
//     if (bounceRate > 5) {
//         recommendations.push('Clean your email list to reduce bounce rate');
//     }
//     if (openRate < 15) {
//         recommendations.push('Optimize subject lines to improve open rates');
//     }
//     if (clickRate < 2) {
//         recommendations.push('Improve email content and call-to-action buttons');
//     }
    
//     return recommendations;
// }

// function getAccountHealthStatus(deliveryRate, bounceRate, complaints, delivered) {
//     const complaintRate = delivered > 0 ? (complaints / delivered) * 100 : 0;
    
//     if (deliveryRate >= 95 && bounceRate <= 2 && complaintRate <= 0.1) {
//         return 'excellent';
//     } else if (deliveryRate >= 90 && bounceRate <= 5 && complaintRate <= 0.3) {
//         return 'good';
//     } else if (deliveryRate >= 85 && bounceRate <= 8 && complaintRate <= 0.5) {
//         return 'warning';
//     } else {
//         return 'critical';
//     }
// }

// function calculateReputationScore(deliveryRate, bounceRate, complaints, delivered) {
//     const complaintRate = delivered > 0 ? (complaints / delivered) * 100 : 0;
    
//     let score = 100;
//     score -= (100 - deliveryRate) * 2; // Delivery rate impact
//     score -= bounceRate * 5; // Bounce rate impact
//     score -= complaintRate * 20; // Complaint rate impact
    
//     return Math.max(0, Math.min(100, Math.round(score)));
// }

// function getAccountRecommendations(deliveryRate, bounceRate, complaints, delivered) {
//     const recommendations = [];
//     const complaintRate = delivered > 0 ? (complaints / delivered) * 100 : 0;
    
//     if (deliveryRate < 90) {
//         recommendations.push('Focus on improving email deliverability');
//     }
//     if (bounceRate > 5) {
//         recommendations.push('Implement regular list cleaning');
//     }
//     if (complaintRate > 0.3) {
//         recommendations.push('Review email content and frequency');
//     }
//     if (delivered === 0) {
//         recommendations.push('Start sending emails to build reputation');
//     }
    
//     return recommendations;
// }

// // Function to make API calls with proper authentication
// async function makeElasticEmailRequest(endpoint, params = {}) {
//     const config = {
//         method: 'GET',
//         url: `${ELASTIC_EMAIL_API_URL}${endpoint}`,
//         headers: {
//             'X-ElasticEmail-ApiKey': ELASTIC_EMAIL_API_KEY,
//             'Content-Type': 'application/json'
//         },
//         params: params
//     };
    
//     return await axios(config);
// }

// // Get specific campaign analytics
// router.get('/campaign/:campaignName', async (req, res) => {
//     try {
//         const { campaignName } = req.params;
        
//         // Validate required parameters
//         if (!campaignName) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Campaign name is required'
//             });
//         }
        
//         // Use v4 API to get campaign stats
//         const response = await makeElasticEmailRequest(`/statistics/campaigns/${encodeURIComponent(campaignName)}`);
        
//         if (response.data) {
//             const data = response.data;
            
//             // Calculate metrics
//             const totalSent = (data.EmailTotal || 0) + (data.SmsTotal || 0);
//             const delivered = data.Delivered || 0;
//             const opened = data.Opened || 0;
//             const clicked = data.Clicked || 0;
//             const bounced = data.Bounced || 0;
//             const unsubscribed = data.Unsubscribed || 0;
//             const complaints = data.Complaints || 0;
            
//             // Calculate rates
//             const deliveryRate = totalSent > 0 ? ((delivered / totalSent) * 100).toFixed(2) : 0;
//             const openRate = delivered > 0 ? ((opened / delivered) * 100).toFixed(2) : 0;
//             const clickRate = delivered > 0 ? ((clicked / delivered) * 100).toFixed(2) : 0;
//             const bounceRate = totalSent > 0 ? ((bounced / totalSent) * 100).toFixed(2) : 0;
//             const unsubscribeRate = delivered > 0 ? ((unsubscribed / delivered) * 100).toFixed(2) : 0;

//             res.json({
//                 success: true,
//                 campaign: campaignName,
//                 metrics: {
//                     // Raw numbers
//                     sent: totalSent,
//                     delivered: delivered,
//                     opened: opened,
//                     clicked: clicked,
//                     bounced: bounced,
//                     unsubscribed: unsubscribed,
//                     complaints: complaints,
//                     recipients: data.Recipients || 0,
//                     inProgress: data.InProgress || 0,
//                     notDelivered: data.NotDelivered || 0,
                    
//                     // Calculated rates
//                     deliveryRate: parseFloat(deliveryRate),
//                     openRate: parseFloat(openRate),
//                     clickRate: parseFloat(clickRate),
//                     bounceRate: parseFloat(bounceRate),
//                     unsubscribeRate: parseFloat(unsubscribeRate),
                    
//                     // Click-to-open rate
//                     clickToOpenRate: opened > 0 ? parseFloat(((clicked / opened) * 100).toFixed(2)) : 0
//                 },
//                 // Performance indicators
//                 performance: {
//                     status: getPerformanceStatus(parseFloat(deliveryRate), parseFloat(openRate), parseFloat(clickRate)),
//                     recommendations: getPerformanceRecommendations(parseFloat(deliveryRate), parseFloat(openRate), parseFloat(clickRate), parseFloat(bounceRate))
//                 }
//             });
//         } else {
//             throw new Error('No data received from Elastic Email API');
//         }
//     } catch (error) {
//         console.error('Error getting specific campaign analytics:', error);
        
//         // Handle specific error cases
//         if (error.response && error.response.status === 404) {
//             return res.status(404).json({
//                 success: false,
//                 error: `Campaign '${req.params.campaignName}' not found`,
//                 campaign: req.params.campaignName
//             });
//         }
        
//         res.status(500).json({
//             success: false,
//             error: error.message,
//             campaign: req.params.campaignName
//         });
//     }
// });

// // Get overall account analytics (all campaigns)
// router.get('/overall', async (req, res) => {
//     try {
//         const { limit = 100, offset = 0 } = req.query;
        
//         // Get all campaigns stats
//         const response = await makeElasticEmailRequest('/statistics/campaigns', {
//             limit: parseInt(limit),
//             offset: parseInt(offset)
//         });
        
//         if (response.data && Array.isArray(response.data)) {
//             const campaigns = response.data;
            
//             // Aggregate all campaign data
//             const totals = campaigns.reduce((acc, campaign) => {
//                 acc.sent += (campaign.EmailTotal || 0) + (campaign.SmsTotal || 0);
//                 acc.delivered += campaign.Delivered || 0;
//                 acc.opened += campaign.Opened || 0;
//                 acc.clicked += campaign.Clicked || 0;
//                 acc.bounced += campaign.Bounced || 0;
//                 acc.unsubscribed += campaign.Unsubscribed || 0;
//                 acc.complaints += campaign.Complaints || 0;
//                 acc.recipients += campaign.Recipients || 0;
//                 acc.inProgress += campaign.InProgress || 0;
//                 acc.notDelivered += campaign.NotDelivered || 0;
//                 return acc;
//             }, {
//                 sent: 0,
//                 delivered: 0,
//                 opened: 0,
//                 clicked: 0,
//                 bounced: 0,
//                 unsubscribed: 0,
//                 complaints: 0,
//                 recipients: 0,
//                 inProgress: 0,
//                 notDelivered: 0
//             });
            
//             // Calculate overall metrics
//             const deliveryRate = totals.sent > 0 ? ((totals.delivered / totals.sent) * 100).toFixed(2) : 0;
//             const openRate = totals.delivered > 0 ? ((totals.opened / totals.delivered) * 100).toFixed(2) : 0;
//             const clickRate = totals.delivered > 0 ? ((totals.clicked / totals.delivered) * 100).toFixed(2) : 0;
//             const bounceRate = totals.sent > 0 ? ((totals.bounced / totals.sent) * 100).toFixed(2) : 0;

//             const analytics = {
//                 success: true,
//                 totalCampaigns: campaigns.length,
//                 overall: {
//                     // Raw numbers
//                     sent: totals.sent,
//                     delivered: totals.delivered,
//                     opened: totals.opened,
//                     clicked: totals.clicked,
//                     bounced: totals.bounced,
//                     unsubscribed: totals.unsubscribed,
//                     complaints: totals.complaints,
//                     recipients: totals.recipients,
//                     inProgress: totals.inProgress,
//                     notDelivered: totals.notDelivered,
                    
//                     // Calculated rates
//                     deliveryRate: parseFloat(deliveryRate),
//                     openRate: parseFloat(openRate),
//                     clickRate: parseFloat(clickRate),
//                     bounceRate: parseFloat(bounceRate),
//                     unsubscribeRate: totals.delivered > 0 ? parseFloat(((totals.unsubscribed / totals.delivered) * 100).toFixed(2)) : 0,
//                     complaintRate: totals.delivered > 0 ? parseFloat(((totals.complaints / totals.delivered) * 100).toFixed(2)) : 0,
                    
//                     // Advanced metrics
//                     clickToOpenRate: totals.opened > 0 ? parseFloat(((totals.clicked / totals.opened) * 100).toFixed(2)) : 0,
//                     engagementRate: totals.delivered > 0 ? parseFloat((((totals.opened + totals.clicked) / totals.delivered) * 100).toFixed(2)) : 0
//                 },
//                 // Account health indicators
//                 accountHealth: {
//                     status: getAccountHealthStatus(parseFloat(deliveryRate), parseFloat(bounceRate), totals.complaints, totals.delivered),
//                     reputationScore: calculateReputationScore(parseFloat(deliveryRate), parseFloat(bounceRate), totals.complaints, totals.delivered),
//                     recommendations: getAccountRecommendations(parseFloat(deliveryRate), parseFloat(bounceRate), totals.complaints, totals.delivered)
//                 }
//             };

//             res.json(analytics);
//         } else {
//             throw new Error('Invalid response format from Elastic Email API');
//         }
//     } catch (error) {
//         console.error('Error getting overall analytics:', error);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// // Get analytics for multiple campaigns
// router.post('/campaigns', async (req, res) => {
//     try {
//         const { campaigns } = req.body;
        
//         if (!campaigns || !Array.isArray(campaigns) || campaigns.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Campaigns array is required'
//             });
//         }
        
//         const campaignAnalytics = await Promise.all(
//             campaigns.map(async (campaignName) => {
//                 try {
//                     const response = await makeElasticEmailRequest(`/statistics/campaigns/${encodeURIComponent(campaignName)}`);
                    
//                     if (response.data) {
//                         const data = response.data;
//                         const totalSent = (data.EmailTotal || 0) + (data.SmsTotal || 0);
//                         const delivered = data.Delivered || 0;
//                         const opened = data.Opened || 0;
//                         const clicked = data.Clicked || 0;
                        
//                         const deliveryRate = totalSent > 0 ? ((delivered / totalSent) * 100).toFixed(2) : 0;
//                         const openRate = delivered > 0 ? ((opened / delivered) * 100).toFixed(2) : 0;
//                         const clickRate = delivered > 0 ? ((clicked / delivered) * 100).toFixed(2) : 0;

//                         return {
//                             campaign: campaignName,
//                             success: true,
//                             metrics: {
//                                 sent: totalSent,
//                                 delivered: delivered,
//                                 opened: opened,
//                                 clicked: clicked,
//                                 bounced: data.Bounced || 0,
//                                 deliveryRate: parseFloat(deliveryRate),
//                                 openRate: parseFloat(openRate),
//                                 clickRate: parseFloat(clickRate)
//                             }
//                         };
//                     } else {
//                         return {
//                             campaign: campaignName,
//                             success: false,
//                             error: 'No data received'
//                         };
//                     }
//                 } catch (error) {
//                     console.log(error)
//                     return {
//                         campaign: campaignName,
//                         success: false,
//                         error: error.response?.status === 404 ? 'Campaign not found' : error.message
//                     };
//                 }
//             })
//         );
        
//         res.json({
//             success: true,
//             campaigns: campaignAnalytics
//         });
//     } catch (error) {
//         console.error('Error getting multiple campaign analytics:', error);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// // Get analytics summary for dashboard
// router.get('/dashboard', async (req, res) => {
//     try {
//         const { limit = 100 } = req.query;
        
//         // Get all campaigns for dashboard summary
//         const response = await makeElasticEmailRequest('/statistics/campaigns', {
//             limit: parseInt(limit)
//         });
        
//         if (response.data && Array.isArray(response.data)) {
//             const campaigns = response.data;
            
//             // Aggregate data for dashboard
//             const totals = campaigns.reduce((acc, campaign) => {
//                 acc.sent += (campaign.EmailTotal || 0) + (campaign.SmsTotal || 0);
//                 acc.delivered += campaign.Delivered || 0;
//                 acc.opened += campaign.Opened || 0;
//                 acc.clicked += campaign.Clicked || 0;
//                 return acc;
//             }, {
//                 sent: 0,
//                 delivered: 0,
//                 opened: 0,
//                 clicked: 0
//             });
            
//             const openRate = totals.delivered > 0 ? ((totals.opened / totals.delivered) * 100).toFixed(1) : 0;
//             const clickRate = totals.delivered > 0 ? ((totals.clicked / totals.delivered) * 100).toFixed(1) : 0;
//             const deliveryRate = totals.sent > 0 ? ((totals.delivered / totals.sent) * 100).toFixed(1) : 0;
            
//             res.json({
//                 success: true,
//                 totalCampaigns: campaigns.length,
//                 summary: {
//                     totalSent: totals.sent,
//                     totalDelivered: totals.delivered,
//                     totalOpened: totals.opened,
//                     totalClicked: totals.clicked,
//                     openRate: parseFloat(openRate),
//                     clickRate: parseFloat(clickRate),
//                     deliveryRate: parseFloat(deliveryRate),
//                     engagementRate: totals.delivered > 0 ? parseFloat((((totals.opened + totals.clicked) / totals.delivered) * 100).toFixed(1)) : 0
//                 }
//             });
//         } else {
//             throw new Error('Failed to fetch dashboard analytics');
//         }
//     } catch (error) {
//         console.error('Error getting dashboard analytics:', error);
//         res.status(500).json({
//             success: false,
//             error: error.message,
//             summary: {
//                 totalSent: 0,
//                 totalDelivered: 0,
//                 totalOpened: 0,
//                 totalClicked: 0,
//                 openRate: 0,
//                 clickRate: 0,
//                 deliveryRate: 0,
//                 engagementRate: 0
//             }
//         });
//     }
// });

// // Get all channels stats
// router.get('/channels', async (req, res) => {
//     try {
//         const { limit = 100, offset = 0 } = req.query;
        
//         const response = await makeElasticEmailRequest('/statistics/channels', {
//             limit: parseInt(limit),
//             offset: parseInt(offset)
//         });
        
//         if (response.data && Array.isArray(response.data)) {
//             const channels = response.data.map(channel => {
//                 const totalSent = (channel.EmailTotal || 0) + (channel.SmsTotal || 0);
//                 const delivered = channel.Delivered || 0;
                
//                 return {
//                     channelName: channel.ChannelName,
//                     metrics: {
//                         sent: totalSent,
//                         delivered: delivered,
//                         opened: channel.Opened || 0,
//                         clicked: channel.Clicked || 0,
//                         bounced: channel.Bounced || 0,
//                         deliveryRate: totalSent > 0 ? parseFloat(((delivered / totalSent) * 100).toFixed(2)) : 0,
//                         openRate: delivered > 0 ? parseFloat(((channel.Opened || 0) / delivered * 100).toFixed(2)) : 0,
//                         clickRate: delivered > 0 ? parseFloat(((channel.Clicked || 0) / delivered * 100).toFixed(2)) : 0
//                     }
//                 };
//             });
            
//             res.json({
//                 success: true,
//                 channels: channels
//             });
//         } else {
//             throw new Error('Invalid response format from Elastic Email API');
//         }
//     } catch (error) {
//         console.error('Error getting channels analytics:', error);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// // Get specific channel stats
// router.get('/channel/:channelName', async (req, res) => {
//     try {
//         const { channelName } = req.params;
        
//         if (!channelName) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Channel name is required'
//             });
//         }
        
//         const response = await makeElasticEmailRequest(`/statistics/channels/${encodeURIComponent(channelName)}`);
        
//         if (response.data) {
//             const data = response.data;
//             const totalSent = (data.EmailTotal || 0) + (data.SmsTotal || 0);
//             const delivered = data.Delivered || 0;
            
//             res.json({
//                 success: true,
//                 channel: channelName,
//                 metrics: {
//                     sent: totalSent,
//                     delivered: delivered,
//                     opened: data.Opened || 0,
//                     clicked: data.Clicked || 0,
//                     bounced: data.Bounced || 0,
//                     unsubscribed: data.Unsubscribed || 0,
//                     complaints: data.Complaints || 0,
//                     recipients: data.Recipients || 0,
//                     deliveryRate: totalSent > 0 ? parseFloat(((delivered / totalSent) * 100).toFixed(2)) : 0,
//                     openRate: delivered > 0 ? parseFloat(((data.Opened || 0) / delivered * 100).toFixed(2)) : 0,
//                     clickRate: delivered > 0 ? parseFloat(((data.Clicked || 0) / delivered * 100).toFixed(2)) : 0
//                 }
//             });
//         } else {
//             throw new Error('No data received from Elastic Email API');
//         }
//     } catch (error) {
//         console.error('Error getting channel analytics:', error);
        
//         if (error.response && error.response.status === 404) {
//             return res.status(404).json({
//                 success: false,
//                 error: `Channel '${req.params.channelName}' not found`,
//                 channel: req.params.channelName
//             });
//         }
        
//         res.status(500).json({
//             success: false,
//             error: error.message,
//             channel: req.params.channelName
//         });
//     }
// });

// module.exports = router;