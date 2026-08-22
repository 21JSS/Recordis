import React from 'react';
import { View, ViewProps } from 'react-native';
import { twMerge } from 'tailwind-merge';

/**
 * Thin wrapper around React Native's View that merges Tailwind `className` strings.
 * Allows using NativeWind's `className` prop on any component while still supporting
 * the standard View props.
 */
export const ThemedView = ({ className, ...props }: ViewProps & { className?: string }) => (
  <View className={twMerge(className)} {...props} />
);
