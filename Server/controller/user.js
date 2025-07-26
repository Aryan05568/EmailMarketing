const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase_client');

const userLogin = async(req, res) => {
    const { email, password } = req.body;

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, user.hashed_password);
        if (!match) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, role: 'user' },
            process.env.JWT_SECRET, { expiresIn: '1h' }
        );

        return res.status(200).json({ 
            token, 
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: 'user'
            }});
    } catch (err) {
        console.error('User login error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const getUsers = async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('name, email,password, created_at,id,total_sent_emails,email_limit')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            return res.status(500).json({ message: 'Failed to fetch users' });
        }

        if (!users || users.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }

        return res.status(200).json({
            message: 'Users retrieved successfully',
            data: users,
            count: users.length
        });

    } catch (err) {
        console.error('Get users error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate if ID is provided
        if (!id) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // First, check if user exists
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('id, email, name')
            .eq('id', id)
            .single();

        if (fetchError || !existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete the user
        const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Error deleting user:', deleteError);
            return res.status(500).json({ message: 'Failed to delete user' });
        }

        return res.status(200).json({ 
            message: 'User deleted successfully',
            deletedUser: {
                id: existingUser.id,
                email: existingUser.email,
                name: existingUser.name
            }
        });

    } catch (err) {
        console.error('Delete user error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const updateUserSentCount = async (req, res) => {
    const { id } = req.params; // Get user ID from URL parameters
    const { sentCount } = req.body;

    // Validate user ID
    if (!id) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    // Validate sent count
    if (typeof sentCount !== 'number' || sentCount < 0) {
        return res.status(400).json({ message: 'Valid sent count is required' });
    }

    try {
        // Check if user exists and get current sent count
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('id, name, total_sent_emails')
            .eq('id', id)
            .single();

        if (fetchError || !existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Calculate new total (add to existing count)
        const currentTotal = existingUser.total_sent_emails || 0;
        const newTotal = currentTotal + sentCount;

        // Update the user's total sent emails count
        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ 
                total_sent_emails: newTotal,
            
            })
            .eq('id', id)
            .select();

        if (updateError) {
            return res.status(500).json({ 
                message: 'Error updating sent count', 
                error: updateError.message 
            });
        }

        if (!updatedUser || updatedUser.length === 0) {
            return res.status(404).json({ message: 'User not found or update failed' });
        }

        console.log(`Updated sent count for user ${existingUser.name}: +${sentCount} (Total: ${newTotal})`);
        
        res.status(200).json({ 
            message: 'Sent count updated successfully', 
            user: updatedUser[0],
            previousTotal: currentTotal,
            newTotal: newTotal,
            campaignSent: sentCount
        });

    } catch (err) {
        console.error('Sent count update error:', err);
        res.status(500).json({ 
            message: 'Internal server error', 
            error: err.message 
        });
    }
};


const userDetails = async(req, res) => {
    const {id} = req.params;

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();


        return res.status(200).json({ 
           data: user,
           message: 'User details retrieved successfully'
        });
    } catch (err) {
        // console.error('User login error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


module.exports = {
    userLogin, getUsers, deleteUser, updateUserSentCount, userDetails
};