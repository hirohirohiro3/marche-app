import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './useAuth';
import { SocialLinks } from '../types';
import { z } from 'zod';

export const socialLinkSchema = z.object({
    url: z.string().url('有効なURLを入力してください').or(z.literal('')),
    enabled: z.boolean(),
    displayName: z.string().optional(),
    type: z.enum(['instagram', 'twitter', 'website', 'line', 'tiktok', 'youtube', 'custom']),
});

export const socialLinksSchema = z.object({
    instagram: socialLinkSchema.optional(),
    twitter: socialLinkSchema.optional(),
    website: socialLinkSchema.optional(),
    line: socialLinkSchema.optional(),
    tiktok: socialLinkSchema.optional(),
    youtube: socialLinkSchema.optional(),
    custom: z.array(socialLinkSchema).optional(),
});

export type SocialLinksFormValues = z.infer<typeof socialLinksSchema>;

export const useSocialLinks = () => {
    const { user } = useAuth();
    const [socialLinks, setSocialLinks] = useState<SocialLinks | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSocialLinks = useCallback(async () => {
        if (!user?.uid) return;
        try {
            const docRef = doc(db, 'stores', user.uid, 'settings', 'social');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setSocialLinks(docSnap.data() as SocialLinks);
            } else {
                setSocialLinks({});
            }
        } catch (error) {
            console.error("Error fetching social links:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchSocialLinks();
    }, [fetchSocialLinks]);

    const saveSocialLinks = async (data: SocialLinks) => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            const docRef = doc(db, 'stores', user.uid, 'settings', 'social');
            await setDoc(docRef, data, { merge: true });
            setSocialLinks(data);
        } catch (error) {
            console.error("Error saving social links:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { socialLinks, loading, saveSocialLinks };
};
