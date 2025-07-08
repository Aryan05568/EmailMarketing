


import EmailMarketingTool from './EmailMarketingTool';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { Mail, Users, BarChart3, Settings, Send, Plus, Eye, Edit, Trash2, Search, Filter, Calendar, RefreshCw,
  AlertCircle,
  CheckCircle, TrendingUp,Activity,Target, User, LogOut, Bell, Menu, X } from 'lucide-react';
import CampaignAnalytics from './CampaignAnalytics';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getProfile, setAuthentication } from '../redux/userSlice';
import CampaignScheduler from './CampaignScheduler';
import { BASEURL } from '../utility/config';

const Dashboard = () => {
    const { isAuthenticated } = useSelector((state) => state.user);
    console.log(isAuthenticated)

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [campaigns, setCampaigns] = useState([])
  const [error, setError] = useState(null);

  const [users, setUsers] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();



 

  const handleLogout = () => {
    dispatch(setAuthentication(false));
    dispatch(getProfile(null));
    toast.success('Logout successfully!', {
      duration: 4000,
      position: 'top-right',
    });
    navigate("/");
  };

  // User Management Functions
  const handleCreateUser = async (userData) => {
    const newUser = {
      id: users.length + 1,
      ...userData,
      status: 'Active',
      lastLogin: 'Never',
      created: new Date().toISOString().split('T')[0]
    };
    try {
      const response = await axios.post(`${BASEURL}/api/auth/create_user`, userData, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });

      const data = response.data;
      console.log(data);



      toast.success('User Logged In successfully!', {
        duration: 4000,
        position: 'top-right',
      });
      fetchUsers();

      // navigate("/dashboard")

    } catch (err) {
      // Axios error handling
      console.log(err)
      toast.error(err.response?.data?.message || 'An error occurred during user creation',{
        duration: 4000,
        position: 'top-right',
      })
      // const errorMessage = err.response?.data?.message || err.message || 'An error occurred during login';

    }
    // setUsers([...users, newUser]);
    setShowUserModal(false);
  };

  console.log(campaigns)

  const fetchCampaigns = async () => {
    try {
     
      const response = await axios.get(`${BASEURL}/get_campaigns`);
      
      if (response.data.success) {
        setCampaigns(response.data.data);
      } else {
        setError('Failed to fetch campaigns');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching campaigns');
    } 
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${BASEURL}/api/auth/users`, {
        withCredentials: true,
      });
      const data = response.data;
      console.log(data);
      setUsers(data?.data);

    } catch (err) {
      console.error(err);
    }
  }

  useEffect(()=>{
    fetchUsers()
    fetchCampaigns();
  
  },[])

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
  return new Date(dateString).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true // optional: for AM/PM format
  });
};


  // const formatDate = (dateString) => {
  //   return new Date(dateString).toLocaleDateString('en-US', {
  //     year: 'numeric',
  //     month: 'short',
  //     day: 'numeric',
  //     hour: '2-digit',
  //     minute: '2-digit'
  //   });
  // };
console.log(users)

  useEffect(()=>{
    if(!isAuthenticated){
      navigate('/login')
    }
  })


const handleEditUser = async (userData) => {
    try {
        // Make API call to update user
        const response = await fetch(`${BASEURL}/api/auth/update_user/${editingUser.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (!response.ok) {
            // Handle error response
            console.error('Error updating user:', result.message);
            // You might want to show an error message to the user here
            alert(result.message || 'Failed to update user');
            return;
        }

        // Update local state with the updated user data from the server
        setUsers(users.map(user =>
            user.id === editingUser.id ? result.user : user
        ));

        setShowUserModal(false);
        setEditingUser(null);
        
        // Optional: Show success message
        toast.success('User updated successfully!', { duration: 3000 });
        console.log('User updated successfully:', result.user);
        
    } catch (error) {
        console.error('Network error updating user:', error);
        alert('Network error. Please try again.');
    }
};
  

  const toggleUserStatus = (userId) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' } : user
    ));
  };

  const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(`${BASEURL}/api/auth/users/${userId}`, {
      withCredentials: true,
    });
    console.log(response.data.message);
    toast.success('User deleted successfully!', { duration: 3000 });
    fetchUsers();
  } catch (err) {
    console.error('Delete error:', err.response.data.message);
  }
};

   const UserModal = () => (
    <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-700 opacity-50"></div>
        </div> */}

        <div className="inline-block  align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-200">
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const userData = {
              name: formData.get('name'),
              email: formData.get('email'),
              password: formData.get('password'),
              role: formData.get('role')
            };
            editingUser ? handleEditUser(userData) : handleCreateUser(userData);
          }}>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h3>
              <p className="text-blue-100 text-sm mt-1">
                {editingUser ? 'Update user information' : 'Add a new team member'}
              </p>
            </div>

            <div className="bg-white px-6 py-6">
              <div className="space-y-6">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingUser?.name || ''}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    defaultValue={editingUser?.email || ''}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    placeholder="Enter email address"
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    name="password"
                    required={!editingUser}
                    defaultValue=""
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    placeholder={editingUser ? "Leave blank to keep current" : "Enter password"}
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                  <select
                    name="role"
                    defaultValue={editingUser?.role || 'User'}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  >
                    <option value="User">User</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse gap-3">
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                {editingUser ? 'Update User' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                }}
                className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );



   const Sidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="flex items-center justify-between h-20 px-6 border-b border-slate-700/50">
        <div className="flex items-center">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <div className="ml-3">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">EmailPro</span>
            <p className="text-xs text-slate-400 font-medium">Marketing Suite</p>
          </div>
        </div>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
        >
          <X className="h-6 w-6 text-slate-400" />
        </button>
      </div>

      <nav className="mt-8 px-4">
        <div className="space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'from-blue-500 to-cyan-500' },
            { id: 'campaigns', label: 'Campaigns', icon: Mail, color: 'from-green-500 to-emerald-500' },
            { id: 'users', label: 'Team', icon: Users, color: 'from-purple-500 to-pink-500' },
            { id: 'compose', label: 'Compose', icon: Send, color: 'from-orange-500 to-red-500' },
            { id: 'analytics', label: 'Scheduler', icon: Calendar, color: 'from-indigo-500 to-purple-500' },
            { id: 'settings', label: 'Settings', icon: Settings, color: 'from-gray-500 to-slate-500' },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r ' + item.color + ' text-white shadow-lg transform scale-105'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white hover:scale-105'
                }`}
              >
                <Icon className={`mr-4 h-5 w-5 ${isActive ? 'animate-pulse' : 'group-hover:scale-110'} transition-transform`} />
                {item.label}
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="absolute bottom-6 left-4 right-4">
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <p className="text-xs text-slate-300 truncate">admin@emailpro.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );



   const Header = () => (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
      <div className="flex items-center justify-between h-18 px-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Menu className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent capitalize">{activeTab}</h1>
            <p className="text-sm text-gray-500 font-medium">Manage your email marketing campaigns</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 relative">
              <Bell className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">3</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-3 bg-gray-50 rounded-xl px-4 py-2">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">Admin</p>
              <p className="text-xs text-gray-500">Super Admin</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );

  const API_BASE_URL = 'http://localhost:5000';

const analyticsAPI = {
  getDashboardStats: async (days = 30) => {
    try {
      const response = await fetch(`${BASEURL}/api/analytics/dashboard?days=${days}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Add if using cookies
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Dashboard stats response:', data); // Debug log
      return data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },
  
  getCampaignAnalytics: async (campaignName, startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`${BASEURL}/api/analytics/campaign/${campaignName}?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Campaign analytics response:', data); // Debug log
      return data;
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      throw error;
    }
  },
  
  getOverallAnalytics: async (startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`${BASEURL}/api/analytics/overall?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Overall analytics response:', data); // Debug log
      return data;
    } catch (error) {
      console.error('Error fetching overall analytics:', error);
      throw error;
    }
  },
  
  getMultipleCampaignAnalytics: async (campaigns, startDate, endDate) => {
    try {
      const response = await fetch(`${BASEURL}/api/analytics/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          campaigns,
          startDate,
          endDate
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Multiple campaign analytics response:', data); // Debug log
      return data;
    } catch (error) {
      console.error('Error fetching multiple campaign analytics:', error);
      throw error;
    }
  }
};

const [stats, setStats] = useState({
    totalSubscribers: 0,
    totalCampaigns: 0,
    openRate: 0,
    clickRate: 0,
    totalSent: 0,
    totalDelivered: 0,
    totalOpened: 0,
    totalClicked: 0,
    deliveryRate: 0,
    engagementRate: 0
  });
  
  // const [campaigns, setCampaigns] = useState([]);
  const [campaignAnalytics, setCampaignAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch dashboard analytics
const fetchDashboardStats = async () => {
  try {
    setLoading(true);
    setError(null);
    
    console.log('Fetching dashboard stats for days:', dateRange); // Debug log
    
    const response = await analyticsAPI.getDashboardStats(parseInt(dateRange));
    
    console.log('Dashboard stats response:', response); // Debug log
    
    if (response && response.success) {
      console.log('Setting stats:', response.summary); // Debug log
      setStats(prevStats => ({
        ...prevStats,
        ...response.summary
      }));
    } else {
      // Handle case where response exists but success is false
      const errorMessage = response?.error || response?.message || 'Failed to fetch dashboard stats';
      throw new Error(errorMessage);
    }
  } catch (err) {
    console.error('Dashboard stats error:', err); // Debug log
    setError(err.message);
  } finally {
    setLoading(false);
    setLastUpdated(new Date());
  }
};

const fetchCampaignAnalytics = async () => {
  try {
    if (campaigns.length === 0) {
      console.log('No campaigns to fetch analytics for'); // Debug log
      return;
    }
    
    console.log('Fetching analytics for campaigns:', campaigns); // Debug log
    
    const campaignNames = campaigns.map(c => c.campaign_name);
    const endDate = new Date();
    const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000);
    
    console.log('Campaign names:', campaignNames); // Debug log
    console.log('Date range:', { startDate, endDate }); // Debug log
    
    const response = await analyticsAPI.getMultipleCampaignAnalytics(
      campaignNames,
      startDate.toISOString(),
      endDate.toISOString()
    );
    
    console.log('Campaign analytics response:', response); // Debug log
    
    if (response && response.success) {
      const analyticsMap = {};
      if (response.campaigns && Array.isArray(response.campaigns)) {
        response.campaigns.forEach(campaign => {
          if (campaign.success) {
            analyticsMap[campaign.campaign] = campaign.metrics;
          }
        });
      }
      console.log('Setting campaign analytics:', analyticsMap); // Debug log
      setCampaignAnalytics(analyticsMap);
    }
  } catch (err) {
    console.error('Error fetching campaign analytics:', err);
    // Don't set error state here as it's not critical for dashboard
  }
};

  

  
  

  // Refresh all data
  const refreshData = async () => {
    await Promise.all([
      fetchDashboardStats(),
      fetchCampaigns()
    ]);
  };

  // Handle date range change
  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
  };

  // Performance status indicator
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

  useEffect(() => {
  console.log('useEffect: Fetching campaigns and dashboard stats'); // Debug log
  fetchCampaigns();
  fetchDashboardStats();
}, [dateRange]); // Add dateRange as dependency

useEffect(() => {
  console.log('useEffect: Campaigns changed, fetching analytics', campaigns); // Debug log
  if (campaigns.length > 0) {
    fetchCampaignAnalytics();
  }
}, [campaigns, dateRange]);

  


  const DashboardContent = () => {
  

  return (
    <div className="p-6 space-y-8">
      {/* Header with controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Analytics Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={refreshData}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            title: 'Total Sent', 
            value: stats.totalSent?.toLocaleString() || '0', 
            icon: Mail, 
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'from-blue-50 to-cyan-50',
            change: '+12.5%',
            changeColor: 'text-green-600'
          },
          { 
            title: 'Delivery Rate', 
            value: `${stats.deliveryRate}%`, 
            icon: CheckCircle, 
            color: 'from-emerald-500 to-green-500',
            bgColor: 'from-emerald-50 to-green-50',
            change: '+3.2%',
            changeColor: getPerformanceIndicator(stats.deliveryRate, 'delivery')
          },
          { 
            title: 'Open Rate', 
            value: `${stats.openRate}%`, 
            icon: Eye, 
            color: 'from-amber-500 to-orange-500',
            bgColor: 'from-amber-50 to-orange-50',
            change: '+2.1%',
            changeColor: getPerformanceIndicator(stats.openRate, 'open')
          },
          { 
            title: 'Click Rate', 
            value: `${stats.clickRate}%`, 
            icon: TrendingUp, 
            color: 'from-purple-500 to-pink-500',
            bgColor: 'from-purple-50 to-pink-50',
            change: '-0.5%',
            changeColor: getPerformanceIndicator(stats.clickRate, 'click')
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              className={`bg-gradient-to-br ${stat.bgColor} p-6 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 group ${loading ? 'animate-pulse' : ''}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className={`text-sm font-semibold ${stat.changeColor} bg-white/80 px-2 py-1 rounded-full`}>
                  {stat.change}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Campaigns */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Recent Campaigns</h3>
              <p className="text-sm text-gray-500 mt-1">Monitor your email campaign performance</p>
            </div>
            <button
              onClick={() => setActiveTab('compose')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-purple-700 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50/50">
              <tr>
                {['Campaign', 'Status', 'Sent', 'Opened', 'Clicked', 'Open Rate', 'Click Rate', 'Date', 'Actions'].map((header) => (
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
                  const analytics = campaignAnalytics[campaign.campaign_name] || {};
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
                        {analytics.sent?.toLocaleString() || '-'}
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-gray-900">
                        {analytics.opened?.toLocaleString() || '-'}
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-gray-900">
                        {analytics.clicked?.toLocaleString() || '-'}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-sm font-medium ${getPerformanceIndicator(analytics.openRate || 0, 'open')}`}>
                          {analytics.openRate ? `${analytics.openRate}%` : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-sm font-medium ${getPerformanceIndicator(analytics.clickRate || 0, 'click')}`}>
                          {analytics.clickRate ? `${analytics.clickRate}%` : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-500">
                        {formatDate(campaign.created_at)}
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-gray-900">
                        <div className="flex space-x-2">
                          <button 
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                            title="View Analytics"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </button>
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

      {/* Additional Analytics Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Summary */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Engagement Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Delivered</span>
              <span className="text-lg font-semibold text-gray-900">
                {stats.totalDelivered?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Opened</span>
              <span className="text-lg font-semibold text-gray-900">
                {stats.totalOpened?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Clicked</span>
              <span className="text-lg font-semibold text-gray-900">
                {stats.totalClicked?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-gray-600">Engagement Rate</span>
              <span className={`text-lg font-semibold ${getPerformanceIndicator(stats.engagementRate || 0, 'open')}`}>
                {stats.engagementRate || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Delivery Rate</span>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  stats.deliveryRate >= 95 ? 'bg-green-500' :
                  stats.deliveryRate >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium">
                  {stats.deliveryRate >= 95 ? 'Excellent' :
                   stats.deliveryRate >= 90 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Open Rate</span>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  stats.openRate >= 20 ? 'bg-green-500' :
                  stats.openRate >= 15 ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium">
                  {stats.openRate >= 20 ? 'Excellent' :
                   stats.openRate >= 15 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Click Rate</span>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  stats.clickRate >= 3 ? 'bg-green-500' :
                  stats.clickRate >= 2 ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium">
                  {stats.clickRate >= 3 ? 'Excellent' :
                   stats.clickRate >= 2 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};




  // Users Tab Content
  const UsersContent = () => (
    <div className="p-6">
     <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Team Management</h2>
          <p className="text-gray-500 mt-1">Manage your team members and their permissions</p>
        </div>
        <button
          onClick={() => setShowUserModal(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-purple-700 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Team Member
        </button>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: 'Total Users', value: users.length, icon: Users, color: 'from-blue-500 to-cyan-500', bgColor: 'from-blue-50 to-cyan-50' },
          { title: 'Active Users', value: users.filter(u => u.status === 'Active').length, icon: Activity, color: 'from-green-500 to-emerald-500', bgColor: 'from-green-50 to-emerald-50' },
          { title: 'Admins', value: users.filter(u => u.role === 'Admin').length, icon: Settings, color: 'from-red-500 to-pink-500', bgColor: 'from-red-50 to-pink-50' },
          { title: 'Managers', value: users.filter(u => u.role === 'Manager').length, icon: Target, color: 'from-purple-500 to-indigo-500', bgColor: 'from-purple-50 to-indigo-50' }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`bg-gradient-to-br ${stat.bgColor} p-6 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 group`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-4">
        <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Team Members</h3>
              <p className="text-sm text-gray-500 mt-1">Manage your team and their access levels</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search team members..."
                  className="pl-10 pr-4 py-2 w-64 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              </div>
              <button className="flex items-center px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full ">
          <thead className="bg-gray-50/50">
              <tr>
                {['User','Password', 'Role',  'Created', 'Actions'].map((header) => (
                  <th key={header} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {users.map((user) => (
               <tr key={user.id} className="hover:bg-gray-50/50 transition-colors duration-200 group">
                  <td className="px-6 py-5">
                    <div className="flex items-center">
                      <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'Admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'Manager' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                     {user.password}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'Admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'Manager' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      User
                    </span>
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleUserStatus(user.id)}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                    >
                      {user.status}
                    </button>
                  </td> */}
                  {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.lastLogin}</td> */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.created_at)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setShowUserModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );


  

  // Settings Tab
  const SettingsContent = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue="EmailPro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default From Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue="noreply@emailpro.com"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Email Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                defaultChecked
              />
              <label className="ml-2 text-sm text-gray-700">Enable email tracking</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                defaultChecked
              />
              <label className="ml-2 text-sm text-gray-700">Enable click tracking</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent />;
      case 'campaigns':
        return <CampaignAnalytics campaigns={campaigns} deleteCampaign={deleteCampaign} />;

      case 'users':
        return <UsersContent />;
      case 'compose':
        return <EmailMarketingTool />;
      case 'analytics':
        return <CampaignScheduler />;
      case 'settings':
        return <SettingsContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        <Header />
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>

      {/* User Modal */}
      {showUserModal && <UserModal />}

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default Dashboard;


