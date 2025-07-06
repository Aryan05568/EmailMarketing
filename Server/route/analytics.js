// routes/analytics.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// Configuration
const ELASTIC_EMAIL_API_KEY = process.env.ELASTIC_EMAIL_API_KEY;
const ELASTIC_EMAIL_API_URL = 'https://api.elasticemail.com/v2';

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
            const data = response.data.data;
            
            // Calculate additional metrics
            const deliveryRate = data.sent > 0 ? ((data.delivered / data.sent) * 100).toFixed(2) : 0;
            const openRate = data.delivered > 0 ? ((data.opened / data.delivered) * 100).toFixed(2) : 0;
            const clickRate = data.delivered > 0 ? ((data.clicked / data.delivered) * 100).toFixed(2) : 0;
            const bounceRate = data.sent > 0 ? ((data.bounced / data.sent) * 100).toFixed(2) : 0;
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
        
        const params = new URLSearchParams({
            apikey: ELASTIC_EMAIL_API_KEY,
            from: start.toISOString().split('T')[0],
            to: end.toISOString().split('T')[0]
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
                    from: start.toISOString().split('T')[0],
                    to: end.toISOString().split('T')[0]
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

            res.json(analytics);
        } else {
            throw new Error('Failed to fetch overall analytics from Elastic Email');
        }
    } catch (error) {
        console.error('Error getting overall analytics:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
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
                        const data = response.data.data;
                        
                        const deliveryRate = data.sent > 0 ? ((data.delivered / data.sent) * 100).toFixed(2) : 0;
                        const openRate = data.delivered > 0 ? ((data.opened / data.delivered) * 100).toFixed(2) : 0;
                        const clickRate = data.delivered > 0 ? ((data.clicked / data.delivered) * 100).toFixed(2) : 0;

                        return {
                            campaign: campaignName,
                            success: true,
                            metrics: {
                                sent: data.sent || 0,
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
            const data = response.data.data;
            
            const openRate = data.delivered > 0 ? ((data.opened / data.delivered) * 100).toFixed(1) : 0;
            const clickRate = data.delivered > 0 ? ((data.clicked / data.delivered) * 100).toFixed(1) : 0;
            const deliveryRate = data.sent > 0 ? ((data.delivered / data.sent) * 100).toFixed(1) : 0;
            
            res.json({
                success: true,
                period: {
                    from: start.toISOString().split('T')[0],
                    to: end.toISOString().split('T')[0],
                    days: parseInt(days)
                },
                summary: {
                    totalSent: data.sent || 0,
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