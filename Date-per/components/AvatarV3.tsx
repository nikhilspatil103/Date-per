import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const SOFT_COLORS = [
  '#7B8CDE', '#9BA5E1', '#B5A8E5', '#C89FD8', '#E89FC8',
  '#A8B5E6', '#C8D4F0', '#D5B4E8', '#E0B8D8', '#D8B8A8',
];

const getInitials = (name: string) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.trim()[0].toUpperCase();
};

const getColorForName = (name: string) => {
  if (!name) return SOFT_COLORS[0];
  const charCode = name.charCodeAt(0);
  return SOFT_COLORS[charCode % SOFT_COLORS.length];
};

const MinimalPattern = ({ size, color }: { size: number; color: string }) => {
  return (
    <View style={[styles.patternContainer, { width: size, height: size }]}>
      <View style={[styles.ring, { 
        width: size * 0.7, 
        height: size * 0.7, 
        borderRadius: size * 0.35,
        borderWidth: size * 0.02,
        borderColor: color,
        opacity: 0.15,
        top: size * 0.15,
        left: size * 0.15
      }]} />
      <View style={[styles.ring, { 
        width: size * 0.5, 
        height: size * 0.5, 
        borderRadius: size * 0.25,
        borderWidth: size * 0.015,
        borderColor: color,
        opacity: 0.1,
        top: size * 0.25,
        left: size * 0.25
      }]} />
    </View>
  );
};

export default function AvatarV3({ photo, name, size = 70, fullscreen = false, square = false }: { photo?: string; name?: string; size?: number | string; fullscreen?: boolean; square?: boolean }) {
  const [imageError, setImageError] = useState(false);
  
  const hasPhoto = photo && 
    photo.trim() !== '' && 
    !photo.includes('default') && 
    !photo.includes('placeholder') &&
    !photo.includes('pravatar');
  
  const baseColor = getColorForName(name || '');
  
  const renderFallback = (containerSize: number, fontSize: number) => (
    <View style={[styles.container, { 
      width: containerSize, 
      height: containerSize, 
      borderRadius: square ? 16 : containerSize / 2,
      backgroundColor: baseColor
    }]}>
      <View style={[styles.overlay, { 
        width: containerSize, 
        height: containerSize, 
        borderRadius: square ? 16 : containerSize / 2,
      }]} />
      <MinimalPattern size={containerSize} color="#FFFFFF" />
      <View style={styles.initialsWrapper}>
        <Text style={[styles.initials, { fontSize, fontWeight: '700' }]}>{getInitials(name || '')}</Text>
      </View>
    </View>
  );
  
  if (fullscreen) {
    if (hasPhoto && !imageError) {
      return (
        <Image 
          source={{ uri: photo }} 
          style={styles.fullscreenAvatar}
          onError={() => setImageError(true)}
        />
      );
    }
    return renderFallback(500, 140);
  }
  
  if (square) {
    const squareSize = typeof size === 'number' ? size : 200;
    if (hasPhoto && !imageError) {
      return (
        <Image 
          source={{ uri: photo }} 
          style={[styles.squareAvatar, typeof size === 'number' ? { width: size, height: size, borderRadius: 16 } : styles.squareFull]}
          onError={() => setImageError(true)}
        />
      );
    }
    return renderFallback(squareSize, squareSize * 0.4);
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
  
  return renderFallback(sizeNum, sizeNum * 0.4);
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  patternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  ring: {
    position: 'absolute',
  },
  initialsWrapper: {
    zIndex: 10,
  },
  initials: {
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  avatar: {
    resizeMode: 'cover',
  },
  fullscreenAvatar: {
    width: '100%',
    height: 500,
    resizeMode: 'cover',
  },
  squareAvatar: {
    resizeMode: 'cover',
    width: '100%',
    height: '100%',
  },
  squareFull: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
});
