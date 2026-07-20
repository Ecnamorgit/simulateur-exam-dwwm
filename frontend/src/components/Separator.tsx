import React from 'react';
import './Separator.css';

interface SeparatorProps {
  width?: string;
  margin?: string;
}

const Separator: React.FC<SeparatorProps> = ({ width = '200px', margin = '24px auto' }) => {
  return (
    <div 
      className="shimmer-divider" 
      style={{ width, margin }} 
    />
  );
};

export default Separator;
