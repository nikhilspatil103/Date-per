import { useState } from 'react';

interface AlertConfig {
  title: string;
  message: string;
  icon?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
}

export const useAlert = () => {
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [visible, setVisible] = useState(false);

  const showAlert = (config: AlertConfig) => {
    setAlertConfig(config);
    setVisible(true);
  };

  const hideAlert = () => {
    setVisible(false);
    setTimeout(() => setAlertConfig(null), 300);
  };

  return {
    alertConfig,
    visible,
    showAlert,
    hideAlert,
  };
};

// Helper functions for common alerts
export const Alert = {
  show: (title: string, message: string, buttons?: any[]) => {
    // This will be replaced by the hook in components
    console.log('Alert:', title, message);
  },
  
  success: (title: string, message: string, onPress?: () => void) => ({
    title,
    message,
    type: 'success' as const,
    buttons: [{ text: 'Great!', onPress }],
  }),
  
  error: (title: string, message: string, onPress?: () => void) => ({
    title,
    message,
    type: 'error' as const,
    buttons: [{ text: 'OK', onPress }],
  }),
  
  warning: (title: string, message: string, buttons?: any[]) => ({
    title,
    message,
    type: 'warning' as const,
    buttons: buttons || [{ text: 'OK' }],
  }),
  
  confirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => ({
    title,
    message,
    type: 'warning' as const,
    buttons: [
      { text: 'Cancel', style: 'cancel' as const, onPress: onCancel },
      { text: 'Confirm', onPress: onConfirm },
    ],
  }),
  
  comingSoon: () => ({
    title: 'Coming Soon! 🚀',
    message: 'This feature will be available soon with exclusive benefits.',
    type: 'info' as const,
    icon: '🚀',
    buttons: [{ text: 'Got it!' }],
  }),
};
