import React from 'react';
import { Text, TextProps } from 'react-native';
import { twMerge } from 'tailwind-merge';

/**
 * Thin wrapper around React Native's Text that merges Tailwind `className` strings.
 */
export const ThemedText = ({ className, ...props }: TextProps & { className?: string }) => (
  <Text className={twMerge(className)} {...props} />
);
