import { useState } from 'react';
import {
  Button,
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { OptionGroup } from '../../../types';

// Dummy data for initial layout
const dummyOptionGroups: OptionGroup[] = [
  {
    id: '1',
    storeId: 'dummy-store-id',
    name: 'サイズ',
    selectionType: 'single',
    choices: [
      { id: 's', name: 'S', priceModifier: 0 },
      { id: 'm', name: 'M', priceModifier: 50 },
      { id: 'l', name: 'L', priceModifier: 100 },
    ],
  },
  {
    id: '2',
    storeId: 'dummy-store-id',
    name: 'トッピング',
    selectionType: 'multiple',
    choices: [
      { id: 'cheese', name: 'チーズ', priceModifier: 100 },
      { id: 'bacon', name: 'ベーコン', priceModifier: 150 },
    ],
  },
];

export default function OptionsAdminPage() {
  // const { optionGroups, loading } = useOptionGroups(); // To be implemented
  const [optionGroups, setOptionGroups] = useState(dummyOptionGroups);
  const [loading, setLoading] = useState(false);

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          オプション管理
        </Typography>
        <Button variant="contained">
          新規追加
        </Button>
      </Box>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <Paper>
          <List>
            {optionGroups.map((group) => (
              <ListItem
                key={group.id}
                secondaryAction={
                  <>
                    <IconButton edge="end" aria-label="edit">
                      <Edit />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete">
                      <Delete />
                    </IconButton>
                  </>
                }
              >
                <ListItemText
                  primary={group.name}
                  secondary={`タイプ: ${group.selectionType === 'single' ? '1つ選択' : '複数選択'} | 選択肢: ${group.choices.map(c => c.name).join(', ')}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Container>
  );
}
