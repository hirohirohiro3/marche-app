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
} from "@mui/material";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Alert } from "@mui/material";

const loginSchema = z.object({
  email: z.string().email({ message: "有効なメールアドレスを入力してください" }),
  password: z.string().min(6, { message: "パスワードは6文字以上である必要があります" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoginError(null);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      navigate("/admin/menu");
    } catch (error) {
      console.error("Login failed:", error);
      setLoginError("メールアドレスまたはパスワードが正しくありません。");
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
                ログイン
              </Typography>
            }
            subheader="管理画面にアクセスします"
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
                id="email"
                label="メールアドレス"
                autoComplete="email"
                autoFocus
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
                autoComplete="current-password"
                {...register("password")}
                error={!!errors.password}
                helperText={errors.password?.message}
              />
              {loginError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {loginError}
                </Alert>
              )}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "ログイン中..." : "ログイン"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
