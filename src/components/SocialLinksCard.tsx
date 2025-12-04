import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import LanguageIcon from '@mui/icons-material/Language';
import ChatIcon from '@mui/icons-material/Chat';
import YouTubeIcon from '@mui/icons-material/YouTube';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import LinkIcon from '@mui/icons-material/Link';
import { SocialLinks, SocialLink } from '../types';

interface SocialLinksCardProps {
    socialLinks: SocialLinks;
}

export default function SocialLinksCard({ socialLinks }: SocialLinksCardProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'instagram': return <InstagramIcon sx={{ color: '#E1306C', fontSize: 32 }} />;
            case 'twitter': return <TwitterIcon sx={{ color: '#1DA1F2', fontSize: 32 }} />;
            case 'website': return <LanguageIcon sx={{ color: '#333', fontSize: 32 }} />;
            case 'line': return <ChatIcon sx={{ color: '#00B900', fontSize: 32 }} />;
            case 'youtube': return <YouTubeIcon sx={{ color: '#FF0000', fontSize: 32 }} />;
            case 'tiktok': return <MusicNoteIcon sx={{ color: '#000000', fontSize: 32 }} />;
            default: return <LinkIcon sx={{ color: '#666', fontSize: 32 }} />;
        }
    };

    const getLabel = (link: SocialLink) => {
        if (link.displayName) return link.displayName;
        switch (link.type) {
            case 'instagram': return 'Instagram';
            case 'twitter': return 'Twitter';
            case 'website': return 'Website';
            case 'line': return 'LINE';
            default: return 'Link';
        }
    };

    const links = [
        socialLinks.instagram,
        socialLinks.twitter,
        socialLinks.website,
        socialLinks.line,
        ...(socialLinks.custom || [])
    ].filter((link): link is SocialLink => !!link && link.enabled && !!link.url);

    if (links.length === 0) return null;

    return (
        <Paper sx={{ p: 3, mt: 3, borderRadius: 3, textAlign: 'center', bgcolor: '#fafafa' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                📱 最新情報をチェック！
            </Typography>

            <Grid container spacing={2}>
                {links.map((link, index) => (
                    <Grid item xs={6} sm={4} key={index}>
                        <Button
                            variant="outlined"
                            fullWidth
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                p: 2,
                                borderRadius: 2,
                                borderColor: '#eee',
                                bgcolor: 'white',
                                color: 'text.primary',
                                textTransform: 'none',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'action.hover',
                                }
                            }}
                        >
                            <Box sx={{ mb: 1 }}>
                                {getIcon(link.type)}
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                                {getLabel(link)}
                            </Typography>
                        </Button>
                    </Grid>
                ))}
            </Grid>
        </Paper>
    );
}
