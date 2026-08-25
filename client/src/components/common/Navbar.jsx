import { useState } from 'react';
import {
  AppBar, Toolbar, Box, Typography, Avatar, IconButton,
  Menu, MenuItem, Chip, Tooltip, Divider, Button
} from '@mui/material';
import {
  LogoutRounded, AccountCircle, FiberManualRecord
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const [anchorEl, setAnchorEl] = useState(null);

  const initials = user?.username?.slice(0, 2).toUpperCase() || '??';

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        background: 'rgba(10,10,15,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        zIndex: 1300,
      }}
    >
      <Toolbar sx={{ gap: 2 }}>
        {/* Logo */}
        <motion.div whileHover={{ scale: 1.05 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(124,58,237,0.4)',
              fontSize: '1.1rem',
            }}>
              💬
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif', letterSpacing: '-0.5px' }}>
              Vartalap
            </Typography>
          </Box>
        </motion.div>

        <Box sx={{ flex: 1 }} />

        {/* Connection status */}
        <Chip
          icon={<FiberManualRecord sx={{ fontSize: '10px !important', color: isConnected ? '#10B981 !important' : '#EF4444 !important' }} />}
          label={isConnected ? 'Connected' : 'Offline'}
          size="small"
          sx={{
            background: isConnected ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            borderColor: isConnected ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
            color: isConnected ? '#10B981' : '#EF4444',
            border: '1px solid',
            fontSize: '0.75rem',
          }}
        />



        {/* User info & avatar */}
        <Box
          id="user-menu-btn"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            p: 0.5,
            pr: 1.5,
            borderRadius: '20px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer',
            '&:hover': { background: 'rgba(255,255,255,0.08)' },
            transition: 'all 0.2s',
          }}
        >
          <Avatar
            src={user?.avatar}
            sx={{
              width: 34, height: 34,
              background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
              fontSize: '0.85rem', fontWeight: 700,
              border: '2px solid rgba(124,58,237,0.5)',
            }}
          >
            {!user?.avatar && initials}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#F1F5F9' }}>
            {user?.username}
          </Typography>
        </Box>

        {/* Visible Direct Logout Button */}
        <Button
          id="navbar-logout-btn"
          variant="outlined"
          size="small"
          startIcon={<LogoutRounded sx={{ fontSize: 16 }} />}
          onClick={logout}
          sx={{
            borderColor: 'rgba(239, 68, 68, 0.4)',
            color: '#EF4444',
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '10px',
            px: 1.8,
            py: 0.6,
            '&:hover': {
              background: 'rgba(239, 68, 68, 0.15)',
              borderColor: '#EF4444',
            },
            transition: 'all 0.2s',
          }}
        >
          Logout
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            sx: {
              mt: 1, minWidth: 200,
              background: 'rgba(19,19,26,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 3,
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{user?.username}</Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8' }}>{user?.email}</Typography>
          </Box>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
          <MenuItem
            id="logout-btn"
            onClick={() => { logout(); setAnchorEl(null); }}
            sx={{ gap: 1.5, color: '#EF4444', mt: 0.5 }}
          >
            <LogoutRounded sx={{ fontSize: 18 }} />
            Sign out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
