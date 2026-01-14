import { useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { DerivedTask, Task } from '@/types';
import TaskForm from '@/components/TaskForm';
import TaskDetailsDialog from '@/components/TaskDetailsDialog';

interface Props {
  tasks: DerivedTask[];
  onAdd: (payload: Omit<Task, 'id'>) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
}

// Helper to compute ROI safely
function computeROI(revenue: number, timeTaken: number): number | null {
  if (!Number.isFinite(revenue) || !Number.isFinite(timeTaken) || timeTaken <= 0) return null;
  return revenue / timeTaken;
}

export default function TaskTable({ tasks, onAdd, onUpdate, onDelete }: Props) {
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [details, setDetails] = useState<Task | null>(null);

  const existingTitles = useMemo(() => tasks.map(t => t.title), [tasks]);

  const handleAddClick = () => {
    setEditing(null);
    setOpenForm(true);
  };

  const handleSubmit = (value: Omit<Task, 'id'> & { id?: string }) => {
    const roi = computeROI(value.revenue, value.timeTaken);
    const payload = { ...value, roi };

    if (value.id) {
      const { id, ...rest } = payload as Task;
      onUpdate(id, rest);
    } else {
      onAdd(payload as Omit<Task, 'id'>);
    }
    setOpenForm(false);
  };

  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight={700}>Tasks</Typography>
          <Button startIcon={<AddIcon />} variant="contained" onClick={handleAddClick}>Add Task</Button>
        </Stack>

        <TableContainer sx={{ maxHeight: 520 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell align="right">Revenue</TableCell>
                <TableCell align="right">Time (h)</TableCell>
                <TableCell align="right">ROI</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {tasks.map(t => (
                <TableRow
                  key={t.id}
                  hover
                  onClick={() => t.roi !== null && setDetails(t)} // prevent opening if ROI is invalid
                  sx={{ cursor: t.roi !== null ? 'pointer' : 'default' }}
                >
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography fontWeight={600}>{t.title}</Typography>
                      {t.notes && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          title={t.notes}
                          dangerouslySetInnerHTML={{ __html: t.notes as unknown as string }}
                        />
                      )}
                    </Stack>
                  </TableCell>

                  <TableCell align="right">${t.revenue.toLocaleString()}</TableCell>
                  <TableCell align="right">{t.timeTaken}</TableCell>
                  <TableCell align="right">
                    {t.roi == null || !Number.isFinite(t.roi) ? 'N/A' : t.roi.toFixed(1)}
                  </TableCell>
                  <TableCell>{t.priority}</TableCell>
                  <TableCell>{t.status}</TableCell>

                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(t);
                            setOpenForm(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(t.id);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box py={6} textAlign="center" color="text.secondary">
                      No tasks yet. Click "Add Task" to get started.
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>

      {/* Task Form */}
      <TaskForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSubmit={handleSubmit}
        existingTitles={existingTitles}
        initial={editing}
      />

      {/* Task Details Dialog */}
      <TaskDetailsDialog
        open={!!details}
        task={details}
        onClose={() => setDetails(null)}
        onSave={onUpdate}
      />
    </Card>
  );
}
