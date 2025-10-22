import { useState, useEffect } from "react";
import {
  Button,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Box,
  CircularProgress,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { auth, db } from "../../../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const menuFormSchema = z.object({
  name: z.string().min(1, "商品名は必須です"),
  price: z.coerce.number().min(0, "価格は0以上である必要があります"),
  category: z.string().min(1, "カテゴリは必須です"),
  description: z.string().optional(),
  sortOrder: z.coerce.number().optional(),
});
type MenuFormValues = z.infer<typeof menuFormSchema>;

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
  isSoldOut: boolean;
  sortOrder: number;
};

export default function MenuAdminPage() {
  const navigate = useNavigate();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deletingMenuItem, setDeletingMenuItem] = useState<MenuItem | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
  });

  useEffect(() => {
    const q = query(collection(db, "menus"), orderBy("sortOrder", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const menusData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MenuItem[];
      setMenus(menusData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenForm = (menuItem: MenuItem | null) => {
    setEditingMenuItem(menuItem);
    reset(menuItem || { name: "", price: 0, category: "", description: "", sortOrder: 0 });
    setImageFile(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMenuItem(null);
  };

  const handleFormSubmit = async (values: MenuFormValues) => {
    try {
      let imageUrl = editingMenuItem?.imageUrl || "";
      if (imageFile) {
        const storage = getStorage();
        const storageRef = ref(storage, `menu-images/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }
      const dataToSave = { ...values, imageUrl };
      if (editingMenuItem) {
        await updateDoc(doc(db, "menus", editingMenuItem.id), dataToSave);
      } else {
        await addDoc(collection(db, "menus"), {...dataToSave, isSoldOut: false});
      }
      handleCloseForm();
    } catch (error) {
      console.error("Failed to save menu item:", error);
    }
  };

  const handleOpenDeleteAlert = (menuItem: MenuItem) => {
    setDeletingMenuItem(menuItem);
    setIsAlertOpen(true);
  };

  const handleCloseDeleteAlert = () => {
    setIsAlertOpen(false);
    setDeletingMenuItem(null);
  };

  const handleDeleteConfirm = async () => {
    if (deletingMenuItem) {
      await deleteDoc(doc(db, "menus", deletingMenuItem.id));
      handleCloseDeleteAlert();
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => navigate("/login"));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4" component="h1">
          メニュー管理
        </Typography>
        <div>
          <Button variant="contained" onClick={() => handleOpenForm(null)} sx={{ mr: 2}}>
            新規追加
          </Button>
          <Button variant="outlined" onClick={handleLogout}>
            ログアウト
          </Button>
        </div>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>商品名</TableCell>
                <TableCell align="right">価格</TableCell>
                <TableCell>カテゴリ</TableCell>
                <TableCell>売り切れ</TableCell>
                <TableCell align="center">アクション</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {menus.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell align="right">¥{row.price.toLocaleString()}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell>{row.isSoldOut ? "はい" : "いいえ"}</TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleOpenForm(row)}><Edit /></IconButton>
                    <IconButton onClick={() => handleOpenDeleteAlert(row)}><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onClose={handleCloseForm}>
        <DialogTitle>{editingMenuItem ? "メニューを編集" : "メニューを追加"}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ mt: 2 }}>
            <TextField {...register("name")} label="商品名" fullWidth margin="dense" error={!!errors.name} helperText={errors.name?.message} />
            <TextField {...register("price")} label="価格" type="number" fullWidth margin="dense" error={!!errors.price} helperText={errors.price?.message} />
            <TextField {...register("category")} label="カテゴリ" fullWidth margin="dense" error={!!errors.category} helperText={errors.category?.message} />
            <TextField {...register("description")} label="商品説明" multiline rows={3} fullWidth margin="dense" />
            <TextField {...register("sortOrder")} label="表示順" type="number" fullWidth margin="dense" />
            <Button variant="contained" component="label" sx={{mt: 2}}>
              画像を選択
              <input type="file" hidden accept="image/*" onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} />
            </Button>
            {imageFile && <Typography sx={{ml: 1, display: 'inline'}}>{imageFile.name}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>キャンセル</Button>
          <Button onClick={handleSubmit(handleFormSubmit)} variant="contained" disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : "保存"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isAlertOpen} onClose={handleCloseDeleteAlert}>
        <DialogTitle>本当に削除しますか？</DialogTitle>
        <DialogContent>
          <Typography>「{deletingMenuItem?.name}」をメニューから完全に削除します。この操作は元に戻せません。</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteAlert}>キャンセル</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
