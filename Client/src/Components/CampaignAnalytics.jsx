import React, { useState } from 'react';
import { 
  Eye, Edit, Trash2, Plus, Search, Filter, ArrowLeft, 
  Mail, Users, MousePointer, TrendingUp, Calendar,
  BarChart3, PieChart, Activity, Download
} from 'lucide-react';
import { toast } from 'react-toastify';
import { BASEURL } from '../utility/config';

const CampaignAnalytics = ({campaigns, campaignAnalytics,setActiveTab}) => {
  const [activeView, setActiveView] = useState('list'); // 'list' or 'analytics'
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const getPerformanceIndicator = (rate, type) => {
    let threshold;
    switch (type) {
      case 'open':
        threshold = { good: 20, average: 15 };
        break;
      case 'click':
        threshold = { good: 3, average: 2 };
        break;
      case 'delivery':
        threshold = { good: 95, average: 90 };
        break;
      default:
        threshold = { good: 20, average: 10 };
    }
    
    if (rate >= threshold.good) return 'text-green-600';
    if (rate >= threshold.average) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const deleteCampaign = async (id) => {
      try {
          const response = await fetch(`${BASEURL}/campaigns/${id}`, {
              method: 'DELETE'
          });
          const result = await response.json();
  
          if (result.success) {
              toast.success('Campaign deleted successfully!', { duration: 2000 });
              fetchCampaigns();
          } else {
              throw new Error(result.message);
          }
      } catch (error) {
          console.error('Error deleting campaign:', error);
          throw error;
      }
  };

 

   const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  

  const CampaignsContent = () => (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Recent Campaigns</h3>
                  <p className="text-sm text-gray-500 mt-1">Monitor your email campaign performance</p>
                </div>
                {/*<button
                  onClick={() => setActiveTab('compose')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-purple-700 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </button>*/}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    {['Campaign', 'Status','Total Recipients', 'Sent', 'Bounced', ,  'Date', 'Actions'].map((header) => (
                      <th key={header} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaigns.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                        <Mail className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-lg font-medium">No campaigns found</p>
                        <p className="text-sm">Create your first campaign to see analytics</p>
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((campaign) => {
                      // const analytics = campaignAnalytics[campaign?.campaign_name] || {};
                      return (
                        <tr key={campaign.id} className="hover:bg-gray-50/50 transition-colors duration-200 group">
                          <td className="px-6 py-5">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                                <Mail className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{campaign.campaign_name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              campaign.status === 'Active' ? 'bg-green-100 text-green-800 border border-green-200' :
                              campaign.status === 'Draft' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                              'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}>
                              {campaign.status}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-sm font-medium text-gray-900">
                            {/* {analytics.sent?.toLocaleString() || '-'} */}
                            {campaign.total_recipients?.toLocaleString() || '-'}
                          </td>
                          <td className="px-6 py-5 text-sm font-medium text-gray-900">
                            {/* {analytics.opened?.toLocaleString() || '-'} */}
                            {campaign.emails_sent?.toLocaleString() || '-'}
                          </td>
                          <td className="px-6 py-5 text-sm font-medium text-gray-900">
                            {/* {analytics.clicked?.toLocaleString() || '-'} */}
                            {campaign.emails_failed?.toLocaleString() || '-'}
                          </td>
                          {/* <td className="px-6 py-5">
                            <span className={`text-sm font-medium`}>
                              
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`text-sm font-medium `}>
                              
                            </span>
                          </td> */}
                          <td className="px-6 py-5 text-sm text-gray-500">
                            {formatDate(campaign.created_at)}
                          </td>
                          <td className="px-6 py-5 text-sm font-medium text-gray-900">
                            <div className="flex space-x-2">
                              
                              <button 
                                onClick={() => deleteCampaign(campaign.id)} 
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                title="Delete Campaign"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
  );



  return (
    <div className="min-h-screen bg-gray-50">
      <CampaignsContent />
    </div>
  );
};

export default CampaignAnalytics;