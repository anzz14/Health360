import React, { useState } from 'react';
import { View, Image, ActivityIndicator, ImageProps } from 'react-native';

interface AppImageProps extends ImageProps {
  className?: string;
}

export const AppImage: React.FC<AppImageProps> = ({ className, ...props }) => {
  const [loading, setLoading] = useState(false);

  return (
    <View className={`justify-center items-center ${className}`}>
      <Image
        {...props}
        className="w-full h-full"
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
      />
      {loading && (
        <View className="absolute">
          <ActivityIndicator color="#000" />
        </View>
      )}
    </View>
  );
};