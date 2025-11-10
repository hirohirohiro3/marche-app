import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Typography,
  Container,
  Box,
  Alert,
} from "@mui/material";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";

const signupSchema = z.object({
  storeName: z.string().min(1, { message: "店舗名は必須です" }),
  email: z.string().email({ message: "有効なメールアドレスを入力してください" }),
  password: z.string().min(6, { message: "パスワードは6文字以上である必要があります" }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const navigate = useNavigate();
  const [signupError, setSignupError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setSignupError(null);
    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const user = userCredential.user;

      // Create a new store document in Firestore
      await setDoc(doc(db, "stores", user.uid), {
        ownerUid: user.uid,
        name: data.storeName,
        createdAt: new Date(),
      });

      navigate("/admin/dashboard");
    } catch (error: any) {
      console.error("Signup failed with error object:", JSON.stringify(error, null, 2));
      if (error.code === 'auth/email-already-in-use') {
        setSignupError("このメールアドレスは既に使用されています。");
      } else {
        setSignupError("アカウントの作成に失敗しました。もう一度お試しください。");
      }
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Card sx={{ minWidth: 400 }}>
          <CardHeader
            title={
              <Typography variant="h5" component="h1" gutterBottom>
                新規アカウント登録
              </Typography>
            }
            subheader="新しい店舗アカウントを作成します"
          />
          <CardContent>
            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              sx={{ mt: 1 }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="storeName"
                label="店舗名"
                autoFocus
                {...register("storeName")}
                error={!!errors.storeName}
                helperText={errors.storeName?.message}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="メールアドレス"
                autoComplete="email"
                {...register("email")}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="パスワード"
                type="password"
                id="password"
                autoComplete="new-password"
                {...register("password")}
                error={!!errors.password}
                helperText={errors.password?.message}
              />
              {signupError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {signupError}
                </Alert>
              )}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "登録中..." : "登録して開始"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
