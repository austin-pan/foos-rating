import React from 'react';
import { IconButton, Stack } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const ReorderButtons = ({
  index,
  totalItems,
  currentDate,
  prevDate,
  nextDate,
  onMoveUp,
  onMoveDown
}) => {
  const isSameDate = (date1, date2) => {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.toDateString() === d2.toDateString();
  };

  const canMoveUp = index > 0 && isSameDate(currentDate, prevDate);
  const canMoveDown = index < totalItems - 1 && isSameDate(currentDate, nextDate);

  const handleMoveUp = (e) => {
    e.stopPropagation();
    if (canMoveUp) {
      onMoveUp();
    }
  };

  const handleMoveDown = (e) => {
    e.stopPropagation();
    if (canMoveDown) {
      onMoveDown();
    }
  };

  return (
    <Stack
      direction="column"
      spacing={0.5}
      sx={{
        position: 'absolute',
        left: 4,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 1,
        backgroundColor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1
      }}
    >
      <IconButton
        size="small"
        onClick={handleMoveUp}
        disabled={!canMoveUp}
        sx={{
          opacity: 1,
          transition: 'opacity 0.2s',
          padding: '4px',
          '&.Mui-disabled': {
            color: 'text.disabled',
            opacity: 0.5
          },
          '&:not(.Mui-disabled):hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        }}
      >
        <ArrowUpwardIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={handleMoveDown}
        disabled={!canMoveDown}
        sx={{
          opacity: 1,
          transition: 'opacity 0.2s',
          padding: '4px',
          '&.Mui-disabled': {
            color: 'text.disabled',
            opacity: 0.5
          },
          '&:not(.Mui-disabled):hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        }}
      >
        <ArrowDownwardIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
};

export default ReorderButtons;
