import { useState, useRef } from 'react';
import {
  Box, Button, TextField, Typography, Paper, InputAdornment,
  IconButton, Alert, CircularProgress, Link, Avatar, Stepper,
  Step, StepLabel
} from '@mui/material';
import {
  Visibility, VisibilityOff, Lock, Email, Person,
  PhotoCamera, AddAPhoto
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import useAuthActions from '../hooks/useAuthActions';

const steps = ['Account Info', 'Profile Photo'];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { handleRegister, handleGoogleLogin, loading, error, setError } = useAuthActions();
  const fileInputRef = useRef(null);

  const [activeStep, setActiveStep] = useState(0);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!username || !email || !password) return;
    setActiveStep(1);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('username', username);
    formData.append('email', email);
    formData.append('password', password);
    if (avatarFile) formData.append('avatar', avatarFile);

    const success = await handleRegister(formData);
    if (success) navigate('/');
  };

  const onGoogleSuccess = async (credentialResponse) => {
    const success = await handleGoogleLogin(credentialResponse);
    if (success) navigate('/');
  };

  const initials = username ? username.slice(0, 2).toUpperCase() : '?';

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.1) 0%, transparent 60%), #0A0A0F',
      py: 4,
    }}>
      {/* Animated orbs */}
      <Box sx={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: '5%', right: '20%',
            width: 280, height: 280, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <motion.div
          animate={{ x: [0, -25, 0], y: [0, 25, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', bottom: '10%', left: '15%',
            width: 220, height: 220, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </Box>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460, padding: '0 16px' }}
      >
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            width: 72, height: 72, borderRadius: '20px', mx: 'auto', mb: 2,
            background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 20px 40px rgba(124,58,237,0.4)',
          }}>
            <Typography sx={{ fontSize: '2rem' }}>💬</Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Create account</Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8', mt: 0.5 }}>
            Join Vartalap and start connecting
          </Typography>
        </Box>

        <Paper sx={{
          p: 4, borderRadius: 4,
          background: 'rgba(19,19,26,0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
        }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4, '& .MuiStepLabel-label': { color: '#94A3B8' }, '& .Mui-active .MuiStepLabel-label': { color: '#A78BFA' }, '& .MuiStepIcon-root.Mui-active': { color: '#7C3AED' }, '& .MuiStepIcon-root.Mui-completed': { color: '#06B6D4' } }}>
            {steps.map((label) => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
          )}

          <AnimatePresence mode="wait">
            {activeStep === 0 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Box component="form" onSubmit={handleNext} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    id="register-username"
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: '#7C3AED', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    id="register-email"
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: '#7C3AED', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    id="register-password"
                    label="Password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    fullWidth
                    helperText="Minimum 6 characters"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: '#7C3AED', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPass(!showPass)} size="small">
                            {showPass ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    id="register-next"
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{ mt: 1, py: 1.5, fontSize: '1rem' }}
                  >
                    Next →
                  </Button>

                  {/* Divider */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    <Box sx={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1 }}>
                      or
                    </Typography>
                    <Box sx={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                  </Box>

                  {/* Google Sign Up */}
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <GoogleLogin
                      onSuccess={onGoogleSuccess}
                      onError={() => {}}
                      theme="filled_black"
                      size="large"
                      width="100%"
                      text="signup_with"
                      shape="rectangular"
                    />
                  </Box>
                </Box>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  {/* Avatar preview */}
                  <Box sx={{ position: 'relative' }}>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Avatar
                        src={avatarPreview}
                        sx={{
                          width: 120, height: 120,
                          fontSize: '2.5rem', fontWeight: 700,
                          background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                          boxShadow: '0 16px 40px rgba(124,58,237,0.4)',
                          cursor: 'pointer',
                          border: '3px solid rgba(124,58,237,0.4)',
                        }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {!avatarPreview && initials}
                      </Avatar>
                    </motion.div>
                    <IconButton
                      id="avatar-upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        position: 'absolute', bottom: 0, right: 0,
                        background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                        color: 'white', width: 36, height: 36,
                        '&:hover': { background: 'linear-gradient(135deg, #6D28D9, #0891B2)' },
                      }}
                    >
                      <AddAPhoto sx={{ fontSize: 18 }} />
                    </IconButton>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </Box>

                  <Typography variant="body2" sx={{ color: '#94A3B8', textAlign: 'center' }}>
                    {avatarFile ? `✅ ${avatarFile.name}` : 'Click the avatar to upload your photo (optional)'}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                    <Button
                      id="register-back"
                      variant="outlined"
                      fullWidth
                      onClick={() => setActiveStep(0)}
                      sx={{ py: 1.5, borderColor: 'rgba(255,255,255,0.15)', color: '#94A3B8' }}
                    >
                      Back
                    </Button>
                    <Button
                      id="register-submit"
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={loading}
                      sx={{ py: 1.5 }}
                    >
                      {loading ? <CircularProgress size={22} color="inherit" /> : 'Create Account'}
                    </Button>
                  </Box>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" sx={{ color: '#94A3B8' }}>
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" sx={{ color: '#A78BFA', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                Sign in
              </Link>
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default RegisterPage;
