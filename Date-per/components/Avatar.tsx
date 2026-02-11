import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const DEFAULT_AVATAR = 'https://ui-avatars.com}/api/?background=random&name=';

const COLORS = [
  '#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a',
  '#30cfd0', '#a8edea', '#ff9a9e', '#ffecd2', '#ff6e7f',
  '#e0c3fc', '#f8b500', '#d299c2', '#89f7fe', '#fdcbf1'
];

const getInitials = (name: string) => {
  if (!name) return '?';
  return name.trim()[0].toUpperCase();
};

const getColorForName = (name: string) => {
  if (!name) return COLORS[0];
  const charCode = name.charCodeAt(0);
  return COLORS[charCode % COLORS.length];
};

export default function Avatar({ photo, name, size = 70, fullscreen = false, square = false }: { photo?: string; name?: string; size?: number | string; fullscreen?: boolean; square?: boolean }) {
  const [imageError, setImageError] = useState(false);
  
  const isLocalFile = photo && (photo.startsWith('file://') || photo.startsWith('/data/'));
  const isEmoji = photo && /^[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]$/u.test(photo.trim());
  const hasPhoto = photo && 
    photo.trim() !== '' && 
    !photo.includes('default') && 
    !photo.includes('placeholder') &&
    !photo.includes('pravatar') &&
    !isEmoji;
  
  const renderFallback = (containerSize: number, fontSize: number) => (
    <View style={[styles.initialsContainer, { 
      width: containerSize, 
      height: containerSize, 
      borderRadius: square ? 0 : containerSize / 2, 
      backgroundColor: getColorForName(name || ''),
      borderWidth: 3,
      borderColor: 'rgba(255,255,255,0.4)'
    }]}>
      <Text style={[styles.initials, { fontSize, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }]}>{getInitials(name || '')}</Text>
    </View>
  );
  
  if (fullscreen) {
    if (hasPhoto && !imageError) {
      return (
        <Image 
          source={isLocalFile ? { uri: photo } : { uri: photo }} 
          style={styles.fullscreenAvatar}
          onError={() => setImageError(true)}
        />
      );
    }
    if (imageError) {
      return renderFallback(500, 120);
    }
    const defaultImageUrl = `${DEFAULT_AVATAR}${encodeURIComponent(name || 'User')}&size=500&length=1`;
    return (
      <Image 
        source={{ uri: defaultImageUrl }} 
        style={styles.fullscreenAvatar}
        onError={() => setImageError(true)}
      />
    );
  }
  
  if (square) {
    const squareSize = typeof size === 'number' ? size : 200;
    if (hasPhoto && !imageError) {
      return (
        <Image 
          source={{ uri: photo }} 
          style={[styles.squareAvatar, typeof size === 'number' ? { width: size, height: size } : styles.squareFull]}
          onError={() => setImageError(true)}
        />
      );
    }
    if (imageError) {
      return renderFallback(squareSize, squareSize * 0.45);
    }
    const defaultImageUrl = `${DEFAULT_AVATAR}${encodeURIComponent(name || 'User')}&size=${squareSize}&length=1`;
    return (
      <Image 
        source={{ uri: defaultImageUrl }} 
        style={[styles.squareAvatar, typeof size === 'number' ? { width: size, height: size } : styles.squareFull]}
        onError={() => setImageError(true)}
      />
    );
  }
  
  const sizeNum = typeof size === 'number' ? size : 70;
  if (hasPhoto && !imageError) {
    return (
      <Image 
        source={{ uri: photo }} 
        style={[styles.avatar, { width: sizeNum, height: sizeNum, borderRadius: sizeNum / 2 }]}
        onError={() => setImageError(true)}
      />
    );
  }
  
  if (imageError) {
    return renderFallback(sizeNum, sizeNum * 0.45);
  }
  
  const defaultImageUrl = `${DEFAULT_AVATAR}${encodeURIComponent(name || 'User')}&size=${sizeNum}&length=1`;
  return (
    <Image 
      source={{ uri: defaultImageUrl }} 
      style={[styles.avatar, { width: sizeNum, height: sizeNum, borderRadius: sizeNum / 2 }]}
      onError={() => setImageError(true)}
    />
  );
}

const styles = StyleSheet.create({
  avatar: { resizeMode: 'cover' },
  initialsContainer: { justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  initials: { color: '#FFFFFF', fontWeight: '500', textAlign: 'center', letterSpacing: 0.5 },
  fullscreenAvatar: { width: '100%', height: 500, resizeMode: 'cover' },
  fullscreenInitials: { width: '100%', height: 500, justifyContent: 'center', alignItems: 'center' },
  fullscreenText: { color: '#FFFFFF', fontSize: 120, fontWeight: 'bold', textAlign: 'center' },
  squareAvatar: { resizeMode: 'cover', width: '100%', height: '100%' },
  squareFull: { width: '100%', height: '100%' },
  squareInitials: { justifyContent: 'center', alignItems: 'center' }
});
