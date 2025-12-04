import { useEffect, useState } from 'react';
import {
    Container, Typography, Paper, Button, Box, TextField,
    Grid, CircularProgress, Alert, Switch, FormControlLabel,
    IconButton, Divider
} from '@mui/material';
import { useSocialLinks, socialLinksSchema, SocialLinksFormValues } from '../../../hooks/useSocialLinks';
import { useForm, Controller, useFieldArray, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import HelpSection from '../../../components/HelpSection';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import LanguageIcon from '@mui/icons-material/Language';
import ChatIcon from '@mui/icons-material/Chat';

export default function SocialLinksSettingsPage() {
    const { socialLinks, loading: hookLoading, saveSocialLinks } = useSocialLinks();
    const [pageError, setPageError] = useState<string | null>(null);
    const [pageSuccess, setPageSuccess] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<SocialLinksFormValues>({
        resolver: zodResolver(socialLinksSchema),
        defaultValues: {
            instagram: { enabled: false, url: '', type: 'instagram' },
            twitter: { enabled: false, url: '', type: 'twitter' },
            website: { enabled: false, url: '', type: 'website' },
            line: { enabled: false, url: '', type: 'line' },
            custom: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "custom",
    });

    useEffect(() => {
        if (socialLinks) {
            reset({
                instagram: socialLinks.instagram || { enabled: false, url: '', type: 'instagram' },
                twitter: socialLinks.twitter || { enabled: false, url: '', type: 'twitter' },
                website: socialLinks.website || { enabled: false, url: '', type: 'website' },
                line: socialLinks.line || { enabled: false, url: '', type: 'line' },
                custom: socialLinks.custom || [],
            });
        }
    }, [socialLinks, reset]);

    const onSubmit: SubmitHandler<SocialLinksFormValues> = async (data) => {
        setPageError(null);
        setPageSuccess(null);
        try {
            await saveSocialLinks(data);
            setPageSuccess('SNS・外部リンク設定を保存しました。');
        } catch (err: any) {
            console.error(err);
            setPageError('設定の保存に失敗しました。');
        }
    };

    if (hookLoading) {
        return <CircularProgress />;
    }

    return (
        <Container maxWidth="md">
            <HelpSection title="SNS・外部リンク設定について">
                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                    <li>注文完了ページに表示するSNSやWebサイトのリンクを設定できます。</li>
                    <li><strong>Instagram, Twitter, 公式サイト, LINE</strong>: URLを入力し、スイッチをONにすると表示されます。</li>
                    <li><strong>カスタムリンク</strong>: YouTubeやTikTokなど、その他のリンクを追加できます。</li>
                </ul>
            </HelpSection>

            <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    SNS・外部リンク設定
                </Typography>

                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Standard Links */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom>基本リンク</Typography>

                        {/* Instagram */}
                        <Box sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <InstagramIcon sx={{ mr: 1, color: '#E1306C' }} />
                                <Typography variant="subtitle1">Instagram</Typography>
                                <Box sx={{ flexGrow: 1 }} />
                                <Controller
                                    name="instagram.enabled"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            control={<Switch checked={field.value} onChange={field.onChange} />}
                                            label="表示する"
                                        />
                                    )}
                                />
                            </Box>
                            <Controller
                                name="instagram.url"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="プロフィールURL (https://instagram.com/...)"
                                        error={!!errors.instagram?.url}
                                        helperText={errors.instagram?.url?.message}
                                    />
                                )}
                            />
                        </Box>

                        {/* Twitter */}
                        <Box sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <TwitterIcon sx={{ mr: 1, color: '#1DA1F2' }} />
                                <Typography variant="subtitle1">Twitter (X)</Typography>
                                <Box sx={{ flexGrow: 1 }} />
                                <Controller
                                    name="twitter.enabled"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            control={<Switch checked={field.value} onChange={field.onChange} />}
                                            label="表示する"
                                        />
                                    )}
                                />
                            </Box>
                            <Controller
                                name="twitter.url"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="プロフィールURL (https://twitter.com/...)"
                                        error={!!errors.twitter?.url}
                                        helperText={errors.twitter?.url?.message}
                                    />
                                )}
                            />
                        </Box>

                        {/* Website */}
                        <Box sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <LanguageIcon sx={{ mr: 1, color: '#333' }} />
                                <Typography variant="subtitle1">公式サイト</Typography>
                                <Box sx={{ flexGrow: 1 }} />
                                <Controller
                                    name="website.enabled"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            control={<Switch checked={field.value} onChange={field.onChange} />}
                                            label="表示する"
                                        />
                                    )}
                                />
                            </Box>
                            <Controller
                                name="website.url"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="URL (https://...)"
                                        error={!!errors.website?.url}
                                        helperText={errors.website?.url?.message}
                                    />
                                )}
                            />
                        </Box>

                        {/* LINE */}
                        <Box sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <ChatIcon sx={{ mr: 1, color: '#00B900' }} />
                                <Typography variant="subtitle1">LINE公式アカウント</Typography>
                                <Box sx={{ flexGrow: 1 }} />
                                <Controller
                                    name="line.enabled"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            control={<Switch checked={field.value} onChange={field.onChange} />}
                                            label="表示する"
                                        />
                                    )}
                                />
                            </Box>
                            <Controller
                                name="line.url"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="友だち追加URL (https://line.me/...)"
                                        error={!!errors.line?.url}
                                        helperText={errors.line?.url?.message}
                                    />
                                )}
                            />
                        </Box>
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* Custom Links */}
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">カスタムリンク</Typography>
                            <Button
                                startIcon={<AddIcon />}
                                onClick={() => append({ enabled: true, url: '', displayName: '', type: 'custom' })}
                                variant="outlined"
                            >
                                追加
                            </Button>
                        </Box>

                        {fields.map((field, index) => (
                            <Box key={field.id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1, position: 'relative' }}>
                                <IconButton
                                    onClick={() => remove(index)}
                                    sx={{ position: 'absolute', top: 8, right: 8 }}
                                    color="error"
                                >
                                    <DeleteIcon />
                                </IconButton>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={4}>
                                        <Controller
                                            name={`custom.${index}.displayName`}
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label="表示名 (例: YouTube)"
                                                    error={!!errors.custom?.[index]?.displayName}
                                                    helperText={errors.custom?.[index]?.displayName?.message}
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={8}>
                                        <Controller
                                            name={`custom.${index}.url`}
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label="URL"
                                                    error={!!errors.custom?.[index]?.url}
                                                    helperText={errors.custom?.[index]?.url?.message}
                                                />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        ))}
                    </Box>

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        disabled={isSubmitting}
                        fullWidth
                    >
                        {isSubmitting ? <CircularProgress size={24} /> : '設定を保存する'}
                    </Button>
                </form>

                {pageError && <Alert severity="error" sx={{ mt: 2 }}>{pageError}</Alert>}
                {pageSuccess && <Alert severity="success" sx={{ mt: 2 }}>{pageSuccess}</Alert>}
            </Paper>
        </Container>
    );
}
