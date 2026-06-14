import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ActivationKey, AdminAccount, ActivityLog } from '@/types/auth';
import { 
  KeyRound, Plus, LogOut, Trash2, Edit, RotateCcw, 
  User, Shield, Settings, Copy, Check, Key, Users, 
  Activity, UserPlus, Upload, Download, Zap, Archive, RefreshCw, BarChart3
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ExtendedActivationKey extends ActivationKey {
  is_deleted?: boolean;
  deleted_at?: string;
  source?: 'local' | 'firebase';
  firebaseId?: string;
}

const AdminDashboard = () => {
  const { user, userType, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [keys, setKeys] = useState<ExtendedActivationKey[]>([]);
  const [deletedKeys, setDeletedKeys] = useState<ExtendedActivationKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('keys');
  
  // Firebase stats
  const [firebaseStats, setFirebaseStats] = useState({ ampro: 0, hipro: 0 });
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  
  // Firebase keys
  const [firebaseKeys, setFirebaseKeys] = useState<any[]>([]);
  const [firebaseKeysLoading, setFirebaseKeysLoading] = useState(true);
  
  // Password dialog for Firebase keys
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedFirebaseKey, setSelectedFirebaseKey] = useState<any>(null);
  const [firebaseKeyUsername, setFirebaseKeyUsername] = useState('');
  const [firebaseKeyPassword, setFirebaseKeyPassword] = useState('');
  const [firebaseKeyExpiresAt, setFirebaseKeyExpiresAt] = useState(''); // yyyy-mm-dd
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  
  // Delete confirmation dialog
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [deleteConfirmCode, setDeleteConfirmCode] = useState('');
  const [keyToDelete, setKeyToDelete] = useState<ExtendedActivationKey | null>(null);
  const [isPermDelete, setIsPermDelete] = useState(false);
  
  // Activity logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  
  // Create key dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKeyUsername, setNewKeyUsername] = useState('');
  const [newKeyPassword, setNewKeyPassword] = useState('');
  const [newKeyExpiresAt, setNewKeyExpiresAt] = useState(''); // yyyy-mm-dd
  const [keyGenerationType, setKeyGenerationType] = useState<'auto' | 'manual'>('auto');
  const [manualKeyValue, setManualKeyValue] = useState('');
  
  // Edit key dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<ExtendedActivationKey | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState(''); // yyyy-mm-dd
  const [editKeyValue, setEditKeyValue] = useState('');

  // Search
  const [keysSearch, setKeysSearch] = useState('');
  
  // Admin management
  const [adminPasswordDialogOpen, setAdminPasswordDialogOpen] = useState(false);
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminAccount | null>(null);
  const [adminEditUsername, setAdminEditUsername] = useState('');
  const [adminEditQuota, setAdminEditQuota] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  
  // Create admin dialog
  const [createAdminDialogOpen, setCreateAdminDialogOpen] = useState(false);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPasswordInput, setNewAdminPasswordInput] = useState('');
  const [newAdminQuota, setNewAdminQuota] = useState('100');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'manager'>('admin');

  // Import dialog
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || (userType !== 'admin' && userType !== 'manager')) {
      navigate('/');
      return;
    }
    fetchKeys();
    fetchDeletedKeys();
    fetchActivityLogs();
    fetchFirebaseStats();
    fetchFirebaseKeys();
    if (userType === 'manager') {
      fetchAdminAccounts();
    }
  }, [isAuthenticated, userType, navigate]);

  useEffect(() => {
    if (!isAuthenticated || (userType !== 'admin' && userType !== 'manager')) return;

    const refreshData = () => {
      fetchKeys();
      fetchFirebaseKeys();

      if (userType === 'manager') {
        fetchDeletedKeys();
      }
    };

    const intervalId = window.setInterval(refreshData, 5000);
    window.addEventListener('focus', refreshData);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshData);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, userType]);

  const fetchFirebaseStats = async () => {
    try {
      setFirebaseLoading(true);
      const { data, error } = await supabase.functions.invoke('firebase-stats');
      if (error) throw error;
      if (data && data.success) {
        setFirebaseStats({ ampro: data.ampro, hipro: data.hipro });
      }
    } catch (error) {
      console.error('Error fetching Firebase stats:', error);
    } finally {
      setFirebaseLoading(false);
    }
  };

  const fetchFirebaseKeys = async () => {
    try {
      setFirebaseKeysLoading(true);
      const { data, error } = await supabase.functions.invoke('firebase-stats', {
        body: { action: 'get_keys' }
      });
      if (error) throw error;
      if (data && data.success) {
        setFirebaseKeys(data.keys || []);
      }
    } catch (error) {
      console.error('Error fetching Firebase keys:', error);
    } finally {
      setFirebaseKeysLoading(false);
    }
  };

  const getFirebaseMirrorForKey = (key: ExtendedActivationKey) => {
    return firebaseKeys.find(
      (firebaseKey) => firebaseKey.key === key.key_value || firebaseKey.firebaseId === key.firebaseId
    );
  };

  const resetFirebaseMirrorHwid = async (key: ExtendedActivationKey) => {
    const firebaseMirror = getFirebaseMirrorForKey(key);

    if (!firebaseMirror) return;

    const { error } = await supabase.functions.invoke('firebase-sync', {
      body: {
        action: 'update_hwid',
        firebaseId: firebaseMirror.firebaseId ?? key.key_value,
        keyData: {
          key_value: key.key_value,
          hwid: null,
        },
      }
    });

    if (error) throw error;
  };

  const syncKeyToFirebase = async (keyData: any): Promise<{ success: boolean; firebaseId?: string; error?: string }> => {
    try {
      console.log('Attempting to sync key to Firebase:', keyData);
      const { data, error } = await supabase.functions.invoke('firebase-sync', {
        body: { action: 'create', keyData }
      });
      
      if (error) {
        console.error('Firebase sync error:', error);
        toast({
          title: 'تحذير',
          description: 'فشل في مزامنة المفتاح مع السيرفر: ' + error.message,
          variant: 'destructive',
        });
        return { success: false, error: error.message };
      }
      
      console.log('Key synced to Firebase successfully:', data);
      return { success: true, firebaseId: data?.firebaseId };
    } catch (error: any) {
      console.error('Error syncing key to Firebase:', error);
      toast({
        title: 'تحذير',
        description: 'فشل في مزامنة المفتاح مع السيرفر',
        variant: 'destructive',
      });
      return { success: false, error: error?.message || 'Unknown error' };
    }
  };

  const upsertActivationKeyFromFirebase = async (params: {
    keyValue: string;
    firebaseId: string;
    username?: string | null;
    password?: string | null;
    expiresAt?: string | null;
    isActive?: boolean;
    hwid?: string | null;
    createdAt?: string | null;
  }) => {
    // Make sure that keys imported/edited from server can login in the app
    // by having a matching row in activation_keys.
    const {
      keyValue,
      firebaseId,
      username,
      password,
      expiresAt,
      isActive,
      hwid,
      createdAt,
    } = params;

    // Try read existing row (by key_value). Avoid .single() to handle missing.
    const { data: existing, error: existingError } = await supabase
      .from('activation_keys')
      .select('*')
      .eq('key_value', keyValue)
      .maybeSingle();

    if (existingError) throw existingError;

    const createdAtIso = existing?.created_at || createdAt || new Date().toISOString();
    const expiresAtIso = expiresAt || existing?.expires_at || new Date().toISOString();
    const durationDays = Math.max(
      0,
      Math.ceil(
        (new Date(expiresAtIso).getTime() - new Date(createdAtIso).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

    const patch: Partial<ActivationKey> & {
      created_at?: string;
      created_by?: string | null;
      is_deleted?: boolean | null;
      deleted_at?: string | null;
    } = {
      key_value: keyValue,
      username: username ?? existing?.username ?? '',
      password_hash: password ?? existing?.password_hash ?? '',
      expires_at: expiresAtIso,
      duration_days: durationDays,
      is_active: isActive ?? existing?.is_active ?? true,
      hwid: hwid ?? existing?.hwid ?? null,
      created_by: existing?.created_by ?? null,
      is_deleted: existing?.is_deleted ?? false,
      deleted_at: existing?.deleted_at ?? null,
    };

    if (!existing) {
      patch.created_at = createdAtIso;
      const { error: insertError } = await supabase.from('activation_keys').insert(patch as any);
      if (insertError) throw insertError;
      return;
    }

    const { error: updateError } = await supabase
      .from('activation_keys')
      .update(patch)
      .eq('id', existing.id);

    if (updateError) throw updateError;
  };

  const handleAddOrEditPasswordToFirebaseKey = async () => {
    if (!selectedFirebaseKey || !firebaseKeyUsername) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال اسم المستخدم',
        variant: 'destructive',
      });
      return;
    }

    try {
      const keyData: Record<string, any> = {
        username: firebaseKeyUsername,
      };

      // Only update password if provided
      if (firebaseKeyPassword) {
        keyData.password = firebaseKeyPassword;
      }

      // Update expiry date if provided
      if (firebaseKeyExpiresAt) {
        // store as end-of-day for consistency
        const expiry = new Date(`${firebaseKeyExpiresAt}T23:59:59.999Z`);
        keyData.expiryDate = expiry.toISOString();
      }

      const { data, error } = await supabase.functions.invoke('firebase-sync', {
        body: {
          action: 'update',
          firebaseId: selectedFirebaseKey.firebaseId,
          keyData,
        },
      });

      if (error) throw error;

      // IMPORTANT: also persist to backend DB so user login works
      await upsertActivationKeyFromFirebase({
        keyValue: selectedFirebaseKey.key,
        firebaseId: selectedFirebaseKey.firebaseId,
        username: firebaseKeyUsername,
        password: firebaseKeyPassword || null,
        expiresAt: firebaseKeyExpiresAt
          ? new Date(`${firebaseKeyExpiresAt}T23:59:59.999Z`).toISOString()
          : null,
        isActive: selectedFirebaseKey.isActive ?? true,
        hwid: selectedFirebaseKey.hwid ?? null,
        createdAt: selectedFirebaseKey.createdAt ?? null,
      });

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث بيانات المفتاح',
      });

      setPasswordDialogOpen(false);
      setSelectedFirebaseKey(null);
      setFirebaseKeyUsername('');
      setFirebaseKeyPassword('');
      setFirebaseKeyExpiresAt('');
      setIsEditingPassword(false);
      fetchKeys();
      fetchFirebaseKeys();
    } catch (error) {
      console.error('Error updating Firebase key:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث بيانات المفتاح',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFirebaseKey = async (key: ExtendedActivationKey) => {
    try {
      const { data, error } = await supabase.functions.invoke('firebase-sync', {
        body: {
          action: 'delete',
          firebaseId: key.firebaseId,
        }
      });

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف المفتاح من السيرفر',
      });

      fetchFirebaseKeys();
    } catch (error) {
      console.error('Error deleting Firebase key:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف المفتاح',
        variant: 'destructive',
      });
    }
  };


  const fetchKeys = async () => {
    try {
      let query = supabase
        .from('activation_keys')
        .select('*')
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('created_at', { ascending: false });
      
      // Admin can only see their own created keys
      if (userType === 'admin') {
        const currentUser = user as AdminAccount;
        query = query.eq('created_by', currentUser.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const localKeys = (data as ExtendedActivationKey[]) || [];
      localKeys.forEach(k => k.source = 'local');
      setKeys(localKeys);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في جلب مفاتيح التنشيط',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedKeys = async () => {
    if (userType !== 'manager') return;
    
    try {
      const { data, error } = await supabase
        .from('activation_keys')
        .select('*')
        .eq('is_deleted', true)
        .order('deleted_at', { ascending: false });
      
      if (error) throw error;
      setDeletedKeys((data as ExtendedActivationKey[]) || []);
    } catch (error) {
      console.error('Error fetching deleted keys:', error);
    }
  };

  const fetchAdminAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdminAccounts((data as AdminAccount[]) || []);
    } catch (error) {
      console.error('Error fetching admin accounts:', error);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setActivityLogs((data as ActivityLog[]) || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    }
  };

  const logActivity = async (actionType: string, targetType: string, targetId?: string, details?: Record<string, any>) => {
    try {
      const currentUser = user as AdminAccount;
      await supabase.from('activity_log').insert({
        admin_id: currentUser.id,
        admin_username: currentUser.username,
        action_type: actionType,
        target_type: targetType,
        target_id: targetId || null,
        details: details || null,
      });
      fetchActivityLogs();
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const generateRandomKey = () => {
    const chars = '0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      if (i > 0) result += '-';
      for (let j = 0; j < 4; j++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    return result;
  };

  const handleCreateKey = async () => {
    if (!newKeyUsername || !newKeyPassword || !newKeyExpiresAt) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة (بما في ذلك تاريخ الانتهاء)',
        variant: 'destructive',
      });
      return;
    }

    // Check quota for admin
    if (userType === 'admin') {
      const currentUser = user as AdminAccount;
      if ((currentUser.licenses_created || 0) >= (currentUser.license_quota || 0)) {
        toast({
          title: 'خطأ',
          description: 'لقد وصلت إلى الحد الأقصى من التراخيص المسموح بها',
          variant: 'destructive',
        });
        return;
      }
    }

    const keyValue = keyGenerationType === 'auto' ? generateRandomKey() : manualKeyValue;

    if (keyGenerationType === 'manual' && !manualKeyValue) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال مفتاح التنشيط',
        variant: 'destructive',
      });
      return;
    }

    const createdAt = new Date();
    const expiresAt = new Date(`${newKeyExpiresAt}T23:59:59.999Z`);
    const durationDays = Math.max(
      0,
      Math.ceil((expiresAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
    );

    const currentUser = user as AdminAccount;

    try {
      // 1) Sync to server FIRST. If it fails, we don't create a local key.
      const syncResult = await syncKeyToFirebase({
        key_value: keyValue,
        username: newKeyUsername,
        password: newKeyPassword,
        duration_days: durationDays,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        hwid: null,
      });

      if (!syncResult.success || !syncResult.firebaseId) {
        toast({
          title: 'خطأ',
          description: 'فشل رفع المفتاح إلى السيرفر. حاول مرة أخرى.',
          variant: 'destructive',
        });
        return;
      }

      // 2) Create the local key only after successful sync
      const { data, error } = await supabase
        .from('activation_keys')
        .insert({
          key_value: keyValue,
          username: newKeyUsername,
          password_hash: newKeyPassword,
          duration_days: durationDays,
          expires_at: expiresAt.toISOString(),
          is_active: true,
          created_by: currentUser.id,
          is_deleted: false,
        })
        .select()
        .single();

      if (error) {
        // Roll back on server to avoid "server-only" keys.
        await supabase.functions.invoke('firebase-sync', {
          body: { action: 'delete', firebaseId: syncResult.firebaseId },
        });

        if (error.code === '23505') {
          toast({
            title: 'خطأ',
            description: 'اسم المستخدم أو مفتاح التنشيط موجود بالفعل',
            variant: 'destructive',
          });
          return;
        }
        throw error;
      }

      // Update licenses_created for admin
      if (userType === 'admin') {
        await supabase
          .from('admin_accounts')
          .update({ licenses_created: (currentUser.licenses_created || 0) + 1 })
          .eq('id', currentUser.id);
      }

      await logActivity('create', 'activation_key', data.id, {
        username: newKeyUsername,
        expires_at: expiresAt.toISOString(),
        firebase_synced: true,
        firebase_id: syncResult.firebaseId,
      });

      toast({
        title: 'تم بنجاح',
        description: 'تم إنشاء مفتاح التنشيط ورفعه للسيرفر تلقائياً',
      });

      setCreateDialogOpen(false);
      setNewKeyUsername('');
      setNewKeyPassword('');
      setNewKeyExpiresAt('');
      setManualKeyValue('');
      setKeyGenerationType('auto');
      fetchKeys();
      fetchFirebaseKeys();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء مفتاح التنشيط',
        variant: 'destructive',
      });
    }
  };

  const handleEditKey = async () => {
    if (!editingKey) return;

    // Manager only
    if (userType !== 'manager') {
      toast({
        title: 'خطأ',
        description: 'هذه العملية للمدير فقط',
        variant: 'destructive',
      });
      return;
    }

    try {
      const updates: Partial<ActivationKey> = {};

      if (editUsername) updates.username = editUsername;
      if (editPassword) updates.password_hash = editPassword;
      if (editKeyValue) updates.key_value = editKeyValue;

      if (editExpiresAt) {
        const createdAt = new Date(editingKey.created_at);
        const expiresAt = new Date(`${editExpiresAt}T23:59:59.999Z`);
        updates.expires_at = expiresAt.toISOString();
        updates.duration_days = Math.max(
          0,
          Math.ceil((expiresAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
        );
      }

      const { error } = await supabase
        .from('activation_keys')
        .update(updates)
        .eq('id', editingKey.id);

      if (error) throw error;

      await logActivity('update', 'activation_key', editingKey.id, updates);

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث مفتاح التنشيط',
      });

      setEditDialogOpen(false);
      setEditingKey(null);
      fetchKeys();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث مفتاح التنشيط',
        variant: 'destructive',
      });
    }
  };

  const handleMoveToTrash = async (key: ExtendedActivationKey) => {
    if (userType === 'admin') {
      toast({
        title: 'خطأ',
        description: 'ليس لديك صلاحية حذف المفاتيح',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('activation_keys')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', key.id);

      if (error) throw error;

      await logActivity('move_to_trash', 'activation_key', key.id);

      toast({
        title: 'تم بنجاح',
        description: 'تم نقل المفتاح إلى سلة المهملات',
      });

      fetchKeys();
      fetchDeletedKeys();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حذف مفتاح التنشيط',
        variant: 'destructive',
      });
    }
  };

  const handleRestoreKey = async (key: ExtendedActivationKey) => {
    try {
      const { error } = await supabase
        .from('activation_keys')
        .update({ is_deleted: false, deleted_at: null })
        .eq('id', key.id);

      if (error) throw error;

      await logActivity('restore', 'activation_key', key.id);

      toast({
        title: 'تم بنجاح',
        description: 'تم استعادة المفتاح',
      });

      fetchKeys();
      fetchDeletedKeys();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في استعادة المفتاح',
        variant: 'destructive',
      });
    }
  };

  const handlePermanentDelete = async () => {
    if (deleteConfirmCode !== '780') {
      toast({
        title: 'خطأ',
        description: 'رمز التأكيد غير صحيح',
        variant: 'destructive',
      });
      return;
    }

    if (!keyToDelete) return;

    try {
      const { error } = await supabase
        .from('activation_keys')
        .delete()
        .eq('id', keyToDelete.id);

      if (error) throw error;

      await logActivity('permanent_delete', 'activation_key', keyToDelete.id);

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف المفتاح نهائياً',
      });

      setDeleteConfirmDialogOpen(false);
      setDeleteConfirmCode('');
      setKeyToDelete(null);
      setIsPermDelete(false);
      fetchDeletedKeys();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حذف المفتاح',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (key: ExtendedActivationKey) => {
    if (userType === 'admin') {
      toast({
        title: 'خطأ',
        description: 'ليس لديك صلاحية تعديل حالة المفاتيح',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('activation_keys')
        .update({ is_active: !key.is_active })
        .eq('id', key.id);

      if (error) throw error;

      await logActivity('toggle_status', 'activation_key', key.id, { new_status: !key.is_active });

      toast({
        title: 'تم بنجاح',
        description: key.is_active ? 'تم تعطيل المفتاح' : 'تم تفعيل المفتاح',
      });

      fetchKeys();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث حالة المفتاح',
        variant: 'destructive',
      });
    }
  };

  const handleResetHwid = async (key: ExtendedActivationKey) => {
    try {
      await resetFirebaseMirrorHwid(key);

      const { error } = await supabase
        .from('activation_keys')
        .update({ hwid: null })
        .eq('id', key.id);

      if (error) throw error;

      await supabase
        .from('hwid_reset_log')
        .insert({
          activation_key_id: key.id,
          reset_by: userType || 'admin',
          days_deducted: 0,
        });

      await logActivity('reset_hwid', 'activation_key', key.id);

      toast({
        title: 'تم بنجاح',
        description: 'تم إعادة ضبط HWID',
      });

      await Promise.all([fetchKeys(), fetchFirebaseKeys()]);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في إعادة ضبط HWID',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateAdminPassword = async () => {
    if (!selectedAdmin || !newAdminPassword) return;

    try {
      const { error } = await supabase
        .from('admin_accounts')
        .update({ password_hash: newAdminPassword, updated_at: new Date().toISOString() })
        .eq('id', selectedAdmin.id);

      if (error) throw error;

      await logActivity('update_password', 'admin_account', selectedAdmin.id);

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث كلمة المرور',
      });

      setAdminPasswordDialogOpen(false);
      setSelectedAdmin(null);
      setNewAdminPassword('');
      fetchAdminAccounts();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث كلمة المرور',
        variant: 'destructive',
      });
    }
  };


  const handleUpdateAdminDetails = async () => {
    if (!selectedAdmin) return;

    if (userType !== 'manager') {
      toast({
        title: 'خطأ',
        description: 'هذه العملية للمدير فقط',
        variant: 'destructive',
      });
      return;
    }

    if (selectedAdmin.role !== 'admin') {
      toast({
        title: 'خطأ',
        description: 'يمكن تعديل بيانات المسؤولين فقط',
        variant: 'destructive',
      });
      return;
    }

    const patch: Partial<AdminAccount> = {};
    if (adminEditUsername.trim()) patch.username = adminEditUsername.trim();
    if (adminEditQuota.trim()) patch.license_quota = parseInt(adminEditQuota, 10);

    try {
      const { error } = await supabase
        .from('admin_accounts')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', selectedAdmin.id);

      if (error) throw error;

      await logActivity('update', 'admin_account', selectedAdmin.id, patch as any);

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث بيانات المسؤول',
      });

      fetchAdminAccounts();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث بيانات المسؤول',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAdminAccount = async (admin: AdminAccount) => {
    if (userType !== 'manager') return;
    if (admin.role !== 'admin') return;

    // prevent deleting yourself
    const current = user as AdminAccount;
    if (admin.id === current?.id) {
      toast({
        title: 'خطأ',
        description: 'لا يمكنك حذف حسابك الحالي',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.from('admin_accounts').delete().eq('id', admin.id);
      if (error) throw error;

      await logActivity('delete', 'admin_account', admin.id, { username: admin.username });

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف حساب المسؤول',
      });

      if (selectedAdmin?.id === admin.id) {
        setSelectedAdmin(null);
        setAdminEditUsername('');
        setAdminEditQuota('');
        setNewAdminPassword('');
      }

      fetchAdminAccounts();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حذف حساب المسؤول',
        variant: 'destructive',
      });
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdminUsername || !newAdminPasswordInput) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول',
        variant: 'destructive',
      });
      return;
    }

    try {
      const insertData: any = {
        username: newAdminUsername,
        password_hash: newAdminPasswordInput,
        role: newAdminRole,
        licenses_created: 0,
      };

      // Only add quota for admin role
      if (newAdminRole === 'admin') {
        insertData.license_quota = parseInt(newAdminQuota);
      }

      const { data, error } = await supabase
        .from('admin_accounts')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      await logActivity('create', 'admin_account', data.id, { username: newAdminUsername, role: newAdminRole, quota: newAdminQuota });

      toast({
        title: 'تم بنجاح',
        description: newAdminRole === 'manager' ? 'تم إنشاء حساب المدير' : 'تم إنشاء حساب المسؤول',
      });

      setCreateAdminDialogOpen(false);
      setNewAdminUsername('');
      setNewAdminPasswordInput('');
      setNewAdminQuota('100');
      setNewAdminRole('admin');
      fetchAdminAccounts();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء الحساب',
        variant: 'destructive',
      });
    }
  };

  const handleExportKeys = () => {
    const csvContent = [
      ['مفتاح التنشيط', 'اسم المستخدم', 'كلمة المرور', 'المدة', 'تاريخ الانتهاء', 'الحالة'].join(','),
      ...keys.map(key => [
        key.key_value,
        key.username,
        key.password_hash,
        key.duration_days,
        key.expires_at,
        key.is_active ? 'نشط' : 'معطل'
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activation_keys_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: 'تم بنجاح',
      description: 'تم تصدير المفاتيح',
    });
  };

  const handleImportKeys = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').slice(1);
        const currentUser = user as AdminAccount;

        let imported = 0;
        for (const line of lines) {
          const [keyValue, username, password, duration] = line.split(',').map(s => s.trim());
          if (!keyValue || !username || !password) continue;

          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + parseInt(duration || '30'));

          const { error } = await supabase
            .from('activation_keys')
            .insert({
              key_value: keyValue,
              username,
              password_hash: password,
              duration_days: parseInt(duration || '30'),
              expires_at: expiresAt.toISOString(),
              is_active: true,
              created_by: currentUser.id,
              is_deleted: false,
            });

          if (!error) imported++;
        }

        await logActivity('import', 'activation_keys', undefined, { count: imported });

        toast({
          title: 'تم بنجاح',
          description: `تم استيراد ${imported} مفتاح`,
        });

        setImportDialogOpen(false);
        fetchKeys();
      } catch (error) {
        toast({
          title: 'خطأ',
          description: 'فشل في استيراد المفاتيح',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getRemainingDays = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const openEditDialog = (key: ExtendedActivationKey) => {
    setEditingKey(key);
    setEditUsername(key.username);
    setEditPassword('');
    setEditExpiresAt(format(new Date(key.expires_at), 'yyyy-MM-dd'));
    setEditKeyValue(key.key_value);
    setEditDialogOpen(true);
  };

  const openFirebaseEditDialog = (key: ExtendedActivationKey) => {
    setSelectedFirebaseKey({
      firebaseId: key.firebaseId,
      key: key.key_value,
      username: key.username,
      password: key.password_hash,
      expiryDate: key.expires_at,
      isActive: key.is_active,
      hwid: key.hwid,
      createdAt: key.created_at,
    });
    setFirebaseKeyUsername(key.username || '');
    setFirebaseKeyPassword('');
    setFirebaseKeyExpiresAt(format(new Date(key.expires_at), 'yyyy-MM-dd'));
    setIsEditingPassword(true);
    setPasswordDialogOpen(true);
  };

  const handleToggleFirebaseKeyActive = async (key: ExtendedActivationKey) => {
    try {
      const { data, error } = await supabase.functions.invoke('firebase-sync', {
        body: {
          action: 'update',
          firebaseId: key.firebaseId,
          keyData: {
            isActive: !key.is_active,
          }
        }
      });

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: key.is_active ? 'تم تعطيل المفتاح' : 'تم تفعيل المفتاح',
      });

      fetchFirebaseKeys();
    } catch (error) {
      console.error('Error toggling Firebase key status:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث حالة المفتاح',
        variant: 'destructive',
      });
    }
  };

  const handleResetFirebaseHwid = async (key: ExtendedActivationKey) => {
    try {
      await resetFirebaseMirrorHwid(key);

      const localKey = keys.find((localKeyItem) => localKeyItem.key_value === key.key_value);

      if (localKey) {
        const { error: localResetError } = await supabase
          .from('activation_keys')
          .update({ hwid: null })
          .eq('id', localKey.id);

        if (localResetError) throw localResetError;

        await supabase
          .from('hwid_reset_log')
          .insert({
            activation_key_id: localKey.id,
            reset_by: userType || 'admin',
            days_deducted: 0,
          });
      }

      await logActivity('reset_hwid', 'activation_key', localKey?.id ?? key.id, {
        source: key.source || 'firebase',
      });

      toast({
        title: 'تم بنجاح',
        description: 'تم إعادة ضبط HWID',
      });

      await Promise.all([fetchKeys(), fetchFirebaseKeys()]);
    } catch (error) {
      console.error('Error resetting Firebase HWID:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إعادة ضبط HWID',
        variant: 'destructive',
      });
    }
  };

  // Combine local and firebase keys for display
  const getCombinedKeys = () => {
    const deletedKeyValues = new Set(deletedKeys.map((key) => key.key_value));
    const firebaseKeysMap = new Map(firebaseKeys.map((fbKey) => [fbKey.key, fbKey]));

    const combined: ExtendedActivationKey[] = keys.map((key) => {
      const firebaseKey = firebaseKeysMap.get(key.key_value);

      if (!firebaseKey) {
        return key;
      }

      return {
        ...key,
        hwid: firebaseKey.hwid ?? key.hwid,
        firebaseId: firebaseKey.firebaseId ?? key.firebaseId,
        source: 'local',
      };
    });
    
    // Only show firebase keys to manager (not to admin)
    if (userType === 'manager') {
      // Add firebase keys that are not in local
      firebaseKeys.forEach(fbKey => {
        const existsLocally = keys.some(k => k.key_value === fbKey.key);
        const existsInTrash = deletedKeyValues.has(fbKey.key);

        if (!existsLocally && !existsInTrash) {
          combined.push({
            id: fbKey.firebaseId,
            key_value: fbKey.key,
            username: fbKey.username || '',
            password_hash: fbKey.password || '',
            duration_days: fbKey.durationDays || 30,
            expires_at: fbKey.expiryDate || new Date().toISOString(),
            is_active: fbKey.isActive ?? true,
            created_at: fbKey.createdAt || new Date().toISOString(),
            hwid: fbKey.hwid || null,
            source: 'firebase',
            firebaseId: fbKey.firebaseId,
          } as ExtendedActivationKey);
        }
      });
    }
    
    return combined;
  };

  const activeKeysCount = keys.filter(k => k.is_active).length;
  const boundKeysCount = keys.filter(k => k.hwid).length;
  const expiredKeysCount = keys.filter(k => new Date(k.expires_at) < new Date()).length;
  const inactiveKeysCount = keys.filter(k => !k.is_active).length;
  
  // Get remaining quota for admin
  const currentUser = user as AdminAccount;
  const remainingQuota = userType === 'admin' ? (currentUser.license_quota || 0) - (currentUser.licenses_created || 0) : null;

  // Admin stats for manager view
  const getAdminStats = (adminId: string) => {
    const adminKeys = keys.filter(k => k.created_by === adminId);
    return {
      total: adminKeys.length,
      active: adminKeys.filter(k => k.is_active).length,
      expired: adminKeys.filter(k => new Date(k.expires_at) < new Date()).length,
      bound: adminKeys.filter(k => k.hwid).length,
    };
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'create': 'إنشاء',
      'update': 'تعديل',
      'delete': 'حذف',
      'toggle_status': 'تغيير الحالة',
      'reset_hwid': 'إعادة ضبط HWID',
      'update_password': 'تحديث كلمة المرور',
      'import': 'استيراد',
      'move_to_trash': 'نقل للمهملات',
      'restore': 'استعادة',
      'permanent_delete': 'حذف نهائي',
    };
    return labels[action] || action;
  };

  const getTargetLabel = (target: string) => {
    const labels: Record<string, string> = {
      'activation_key': 'مفتاح تنشيط',
      'activation_keys': 'مفاتيح تنشيط',
      'admin_account': 'حساب مسؤول',
    };
    return labels[target] || target;
  };

  const allCombinedKeys = getCombinedKeys();
  const filteredCombinedKeys = allCombinedKeys.filter((k) => {
    const q = keysSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (k.key_value || '').toLowerCase().includes(q) ||
      (k.username || '').toLowerCase().includes(q)
    );
  });


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-info/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <Zap className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
                <p className="text-muted-foreground">
                  مرحباً، <span className="text-primary font-semibold">{currentUser?.username}</span>
                  <Badge variant="secondary" className="mr-2 bg-primary/10 text-primary border-primary/20">
                    {userType === 'admin' ? 'مسؤول' : 'مدير'}
                  </Badge>
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <ThemeToggle />
              <LanguageToggle />
              <Button variant="outline" onClick={() => navigate('/statistics')} className="gap-2 border-primary/30 hover:bg-primary/10">
                <BarChart3 className="w-4 h-4" />
                الإحصائيات
              </Button>
              {userType === 'manager' && (
                <>
                  <Dialog open={createAdminDialogOpen} onOpenChange={setCreateAdminDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2 border-primary/30 hover:bg-primary/10">
                        <UserPlus className="w-4 h-4" />
                        إضافة مسؤول
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border">
                      <DialogHeader>
                        <DialogTitle>إضافة مسؤول / مدير جديد</DialogTitle>
                        <DialogDescription>أدخل بيانات الحساب الجديد</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>الصلاحية</Label>
                          <Select value={newAdminRole} onValueChange={(v) => setNewAdminRole(v as 'admin' | 'manager')}>
                            <SelectTrigger className="bg-background border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">مسؤول (Admin)</SelectItem>
                              <SelectItem value="manager">مدير (Manager)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>اسم المستخدم</Label>
                          <Input
                            value={newAdminUsername}
                            onChange={(e) => setNewAdminUsername(e.target.value)}
                            placeholder="أدخل اسم المستخدم"
                            className="bg-background border-border"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>كلمة المرور</Label>
                          <Input
                            type="password"
                            value={newAdminPasswordInput}
                            onChange={(e) => setNewAdminPasswordInput(e.target.value)}
                            placeholder="أدخل كلمة المرور"
                            className="bg-background border-border"
                          />
                        </div>
                        {newAdminRole === 'admin' && (
                          <div className="space-y-2">
                            <Label>عدد التراخيص المسموح بها</Label>
                            <Input
                              type="number"
                              value={newAdminQuota}
                              onChange={(e) => setNewAdminQuota(e.target.value)}
                              placeholder="أدخل عدد التراخيص"
                              className="bg-background border-border"
                            />
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button onClick={handleCreateAdmin} className="gradient-primary text-primary-foreground">إضافة</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={adminPasswordDialogOpen} onOpenChange={setAdminPasswordDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2 border-primary/30 hover:bg-primary/10">
                        <Settings className="w-4 h-4" />
                        إدارة المسؤولين
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl bg-card border-border">
                      <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                          <Shield className="w-5 h-5 text-primary" />
                          إدارة المسؤولين
                        </DialogTitle>
                        <DialogDescription>عرض وتعديل حسابات المسؤولين مع إحصائيات تفصيلية</DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="h-[500px]">
                        <div className="space-y-4">
                          {adminAccounts.map((admin) => {
                            const stats = getAdminStats(admin.id);
                            return (
                              <div key={admin.id} className="glass-card rounded-xl p-4 border border-border/50">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${admin.role === 'manager' ? 'gradient-primary' : 'bg-secondary'}`}>
                                      {admin.role === 'manager' ? <Shield className="w-6 h-6 text-primary-foreground" /> : <User className="w-6 h-6 text-foreground" />}
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-foreground">{admin.username}</h3>
                                      <Badge variant={admin.role === 'manager' ? 'default' : 'secondary'} className={admin.role === 'manager' ? 'gradient-primary text-primary-foreground text-xs' : 'text-xs'}>
                                        {admin.role === 'manager' ? 'مدير' : 'مسؤول'}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  {admin.role === 'admin' && (
                                    <div className="grid grid-cols-4 gap-2 flex-1 max-w-md">
                                      <div className="text-center p-2 rounded-lg bg-primary/10">
                                        <p className="text-lg font-bold text-primary">{stats.total}</p>
                                        <p className="text-xs text-muted-foreground">إجمالي</p>
                                      </div>
                                      <div className="text-center p-2 rounded-lg bg-emerald-500/10">
                                        <p className="text-lg font-bold text-emerald-500">{stats.active}</p>
                                        <p className="text-xs text-muted-foreground">نشط</p>
                                      </div>
                                      <div className="text-center p-2 rounded-lg bg-destructive/10">
                                        <p className="text-lg font-bold text-destructive">{stats.expired}</p>
                                        <p className="text-xs text-muted-foreground">منتهي</p>
                                      </div>
                                      <div className="text-center p-2 rounded-lg bg-violet-500/10">
                                        <p className="text-lg font-bold text-violet-500">{stats.bound}</p>
                                        <p className="text-xs text-muted-foreground">مرتبط</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center gap-2">
                                    {admin.role === 'admin' && (
                                      <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                                        {admin.licenses_created}/{admin.license_quota}
                                      </span>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedAdmin(admin);
                                        setAdminEditUsername(admin.username);
                                        setAdminEditQuota(String(admin.license_quota || 0));
                                        setNewAdminPassword('');
                                      }}
                                      className="gap-1"
                                    >
                                      <Edit className="w-3 h-3" />
                                      تعديل
                                    </Button>
                                    {admin.role === 'admin' && (
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteAdminAccount(admin)}
                                        className="gap-1"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        حذف
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                      
                      {selectedAdmin && (
                        <div className="mt-4 p-5 border border-primary/20 rounded-xl space-y-4 bg-gradient-to-br from-primary/5 to-transparent">
                          <h4 className="font-semibold text-lg flex items-center gap-2">
                            <Edit className="w-4 h-4 text-primary" />
                            تعديل: {selectedAdmin.username}
                          </h4>

                          {selectedAdmin.role === 'admin' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>اسم المستخدم</Label>
                                <Input
                                  value={adminEditUsername}
                                  onChange={(e) => setAdminEditUsername(e.target.value)}
                                  className="bg-background border-border"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>عدد التراخيص المسموح بها</Label>
                                <Input
                                  type="number"
                                  value={adminEditQuota}
                                  onChange={(e) => setAdminEditQuota(e.target.value)}
                                  className="bg-background border-border"
                                />
                              </div>
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label>كلمة المرور الجديدة</Label>
                            <Input
                              type="password"
                              value={newAdminPassword}
                              onChange={(e) => setNewAdminPassword(e.target.value)}
                              placeholder="كلمة المرور الجديدة"
                              className="bg-background border-border"
                            />
                          </div>

                          <div className="flex gap-2">
                            {selectedAdmin.role === 'admin' && (
                              <Button onClick={handleUpdateAdminDetails} className="gradient-primary text-primary-foreground gap-2">
                                <Check className="w-4 h-4" />
                                حفظ البيانات
                              </Button>
                            )}
                            <Button onClick={handleUpdateAdminPassword} variant="outline" className="gap-2">
                              <Key className="w-4 h-4" />
                              تحديث كلمة المرور
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </>
              )}
              
              <Button variant="destructive" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Firebase Stats */}
            <div className="stat-card glass-card border border-emerald-500/20 glow-effect">
              <div className="absolute top-0 left-0 right-0 h-1 gradient-success rounded-t-2xl" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-float">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {firebaseLoading ? '...' : firebaseStats.ampro}
                  </p>
                  <p className="text-sm text-muted-foreground">AM-Pro</p>
                </div>
              </div>
            </div>
            
            <div className="stat-card glass-card border border-blue-500/20">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-2xl" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30 animate-float" style={{ animationDelay: '0.5s' }}>
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {firebaseLoading ? '...' : firebaseStats.hipro}
                  </p>
                  <p className="text-sm text-muted-foreground">Hi-Pro</p>
                </div>
              </div>
            </div>

            {/* Keys Stats */}
            <div className="stat-card glass-card border border-primary/20">
              <div className="absolute top-0 left-0 right-0 h-1 gradient-primary rounded-t-2xl" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <Key className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{allCombinedKeys.length}</p>
                  <p className="text-sm text-muted-foreground">إجمالي</p>
                </div>
              </div>
            </div>
            
            <div className="stat-card glass-card border border-emerald-500/20">
              <div className="absolute top-0 left-0 right-0 h-1 gradient-success rounded-t-2xl" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-emerald-500">{activeKeysCount}</p>
                  <p className="text-sm text-muted-foreground">نشط</p>
                </div>
              </div>
            </div>
            
            <div className="stat-card glass-card border border-violet-500/20">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500 rounded-t-2xl" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-violet-500">{boundKeysCount}</p>
                  <p className="text-sm text-muted-foreground">مرتبط</p>
                </div>
              </div>
            </div>

            <div className="stat-card glass-card border border-destructive/20">
              <div className="absolute top-0 left-0 right-0 h-1 gradient-danger rounded-t-2xl" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                  <RotateCcw className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-destructive">{expiredKeysCount}</p>
                  <p className="text-sm text-muted-foreground">منتهي</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Stats for Admin/Manager */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userType === 'admin' && remainingQuota !== null && (
              <Card className="glass-card border-amber-500/20 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <KeyRound className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="text-4xl font-bold text-amber-500">{remainingQuota}</p>
                        <p className="text-sm text-muted-foreground">تراخيص متبقية من {currentUser.license_quota}</p>
                      </div>
                    </div>
                    <div className="w-24 h-24">
                      <svg viewBox="0 0 100 100" className="transform -rotate-90">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                        <circle
                          cx="50" cy="50" r="40" fill="none"
                          stroke="url(#quotaGradient)"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${((currentUser.licenses_created || 0) / (currentUser.license_quota || 1)) * 251.2} 251.2`}
                        />
                        <defs>
                          <linearGradient id="quotaGradient">
                            <stop offset="0%" stopColor="hsl(38 92% 50%)" />
                            <stop offset="100%" stopColor="hsl(25 95% 53%)" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {userType === 'manager' && (
              <Card className="glass-card border-destructive/20 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 gradient-danger" />
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                    <Trash2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-destructive">{deletedKeys.length}</p>
                    <p className="text-sm text-muted-foreground">مفاتيح في سلة المهملات</p>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className={`grid w-full max-w-lg bg-muted/50 ${userType === 'manager' ? 'grid-cols-3' : 'grid-cols-1'}`}>
              <TabsTrigger value="keys" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Key className="w-4 h-4" />
                المفاتيح
              </TabsTrigger>
              {userType === 'manager' && (
                <>
                  <TabsTrigger value="trash" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Archive className="w-4 h-4" />
                    المهملات
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Activity className="w-4 h-4" />
                    النشاطات
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="keys" className="mt-6">
              {/* Keys Table */}
              <Card className="glass-effect border-primary/20">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <KeyRound className="w-5 h-5 text-primary" />
                      مفاتيح التنشيط
                    </CardTitle>
                    <CardDescription>
                      {userType === 'admin' ? 'المفاتيح التي قمت بإنشائها' : 'إدارة جميع مفاتيح التنشيط (المحلية + السيرفر)'}
                    </CardDescription>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="w-full sm:w-72">
                      <Input
                        value={keysSearch}
                        onChange={(e) => setKeysSearch(e.target.value)}
                        placeholder="بحث بالمفتاح أو اسم المستخدم"
                        className="bg-background border-border"
                      />
                    </div>

                    <Button variant="outline" onClick={() => { fetchKeys(); fetchFirebaseKeys(); }} className="gap-2 border-primary/30 hover:bg-primary/10">
                      <RefreshCw className="w-4 h-4" />
                      تحديث
                    </Button>
                    
                    {userType === 'manager' && (
                      <>
                        <Button variant="outline" onClick={handleExportKeys} className="gap-2 border-primary/30 hover:bg-primary/10">
                          <Download className="w-4 h-4" />
                          تصدير
                        </Button>
                        
                        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2 border-primary/30 hover:bg-primary/10">
                              <Upload className="w-4 h-4" />
                              استيراد
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-card border-border">
                            <DialogHeader>
                              <DialogTitle>استيراد مفاتيح</DialogTitle>
                              <DialogDescription>
                                قم برفع ملف CSV يحتوي على المفاتيح (مفتاح, اسم مستخدم, كلمة مرور, مدة)
                              </DialogDescription>
                            </DialogHeader>
                            <Input
                              type="file"
                              accept=".csv"
                              onChange={handleImportKeys}
                              className="bg-background border-border"
                            />
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                    
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2 gradient-primary shadow-lg shadow-primary/30 text-primary-foreground">
                          <Plus className="w-4 h-4" />
                          مفتاح جديد
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border">
                        <DialogHeader>
                          <DialogTitle>إنشاء مفتاح تنشيط جديد</DialogTitle>
                          <DialogDescription>أدخل بيانات المفتاح الجديد</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>نوع المفتاح</Label>
                            <Select value={keyGenerationType} onValueChange={(v) => setKeyGenerationType(v as 'auto' | 'manual')}>
                              <SelectTrigger className="bg-background border-border">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="auto">تلقائي</SelectItem>
                                <SelectItem value="manual">يدوي</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {keyGenerationType === 'manual' && (
                            <div className="space-y-2">
                              <Label>مفتاح التنشيط</Label>
                              <Input
                                value={manualKeyValue}
                                onChange={(e) => setManualKeyValue(e.target.value.toUpperCase())}
                                placeholder="XXXX-XXXX-XXXX-XXXX"
                                className="bg-background border-border"
                              />
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <Label>اسم المستخدم</Label>
                            <Input
                              value={newKeyUsername}
                              onChange={(e) => setNewKeyUsername(e.target.value)}
                              placeholder="أدخل اسم المستخدم"
                              className="bg-background border-border"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>كلمة المرور</Label>
                            <Input
                              type="password"
                              value={newKeyPassword}
                              onChange={(e) => setNewKeyPassword(e.target.value)}
                              placeholder="أدخل كلمة المرور"
                              className="bg-background border-border"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>تاريخ الانتهاء</Label>
                            <Input
                              type="date"
                              value={newKeyExpiresAt}
                              onChange={(e) => setNewKeyExpiresAt(e.target.value)}
                              className="bg-background border-border"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleCreateKey} className="gradient-primary text-primary-foreground">إنشاء</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead>مفتاح التنشيط</TableHead>
                          <TableHead>اسم المستخدم</TableHead>
                          <TableHead>تاريخ الإنشاء</TableHead>
                          <TableHead>تاريخ الانتهاء</TableHead>
                          <TableHead>HWID</TableHead>
                          {userType === 'manager' && <TableHead>أنشئ بواسطة</TableHead>}
                          <TableHead>الحالة</TableHead>
                          <TableHead>الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCombinedKeys.map((key) => {
                          const remaining = getRemainingDays(key.expires_at);
                          const creator = adminAccounts.find(a => a.id === key.created_by);
                          const isFirebaseKey = key.source === 'firebase';
                          
                          return (
                            <TableRow key={key.id} className="animate-fade-in border-border">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground">
                                    {key.key_value}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => copyToClipboard(key.key_value)}
                                  >
                                    {copiedKey === key.key_value ? (
                                      <Check className="w-4 h-4 text-success" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{key.username || <span className="text-muted-foreground">غير محدد</span>}</TableCell>
                              <TableCell className="text-sm">
                                {format(new Date(key.created_at), 'dd/MM/yyyy', { locale: ar })}
                              </TableCell>
                              <TableCell>
                                <Badge variant={remaining <= 0 ? 'destructive' : remaining <= 7 ? 'secondary' : 'default'} className={remaining > 7 ? 'bg-primary/10 text-primary border-primary/20' : ''}>
                                  {remaining <= 0 ? 'منتهي' : format(new Date(key.expires_at), 'dd/MM/yyyy', { locale: ar })}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={key.hwid ? 'default' : 'outline'} className={key.hwid ? 'bg-violet-500/10 text-violet-600 border-violet-500/20' : ''}>
                                  {key.hwid ? 'مرتبط' : 'غير مرتبط'}
                                </Badge>
                              </TableCell>
                              {userType === 'manager' && (
                                <TableCell>
                                  <span className="text-sm text-muted-foreground">
                                    {creator?.username || 'غير معروف'}
                                  </span>
                                </TableCell>
                              )}
                              <TableCell>
                                {userType === 'manager' ? (
                                  <Switch
                                    checked={key.is_active}
                                    onCheckedChange={() => isFirebaseKey ? handleToggleFirebaseKeyActive(key) : handleToggleActive(key)}
                                  />
                                ) : (
                                  <Badge variant={key.is_active ? 'default' : 'secondary'} className={key.is_active ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : ''}>
                                    {key.is_active ? 'نشط' : 'معطل'}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {userType === 'manager' && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => isFirebaseKey ? openFirebaseEditDialog(key) : openEditDialog(key)}
                                      title="تعديل"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {key.hwid && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => isFirebaseKey ? handleResetFirebaseHwid(key) : handleResetHwid(key)}
                                      title="إعادة ضبط HWID"
                                    >
                                      <RotateCcw className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {userType === 'manager' && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => isFirebaseKey ? handleDeleteFirebaseKey(key) : handleMoveToTrash(key)}
                                      title={isFirebaseKey ? "حذف من السيرفر" : "نقل للمهملات"}
                                    >
                                      <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trash Tab */}
            {userType === 'manager' && (
              <TabsContent value="trash" className="mt-6">
                <Card className="glass-effect border-destructive/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Archive className="w-5 h-5 text-destructive" />
                      سلة المهملات
                    </CardTitle>
                    <CardDescription>المفاتيح المحذوفة - يمكن استعادتها أو حذفها نهائياً</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {deletedKeys.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">
                        سلة المهملات فارغة
                      </div>
                    ) : (
                      <ScrollArea className="h-[500px]">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border">
                              <TableHead>مفتاح التنشيط</TableHead>
                              <TableHead>اسم المستخدم</TableHead>
                              <TableHead>تاريخ الحذف</TableHead>
                              <TableHead>الإجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {deletedKeys.map((key) => (
                              <TableRow key={key.id} className="animate-fade-in border-border">
                                <TableCell>
                                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                    {key.key_value}
                                  </code>
                                </TableCell>
                                <TableCell className="font-medium">{key.username}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {key.deleted_at ? format(new Date(key.deleted_at), 'dd/MM/yyyy HH:mm', { locale: ar }) : '-'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRestoreKey(key)}
                                      className="gap-1 border-success/30 text-success hover:bg-success/10"
                                    >
                                      <RefreshCw className="w-3 h-3" />
                                      استعادة
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setKeyToDelete(key);
                                        setIsPermDelete(true);
                                        setDeleteConfirmDialogOpen(true);
                                      }}
                                      className="gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      حذف نهائي
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {userType === 'manager' && (
              <TabsContent value="activity" className="mt-6">
                <Card className="glass-effect border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Activity className="w-5 h-5 text-primary" />
                      سجل النشاطات
                    </CardTitle>
                    <CardDescription>جميع النشاطات التي قام بها المسؤولين</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border">
                            <TableHead>التاريخ</TableHead>
                            <TableHead>المسؤول</TableHead>
                            <TableHead>الإجراء</TableHead>
                            <TableHead>الهدف</TableHead>
                            <TableHead>التفاصيل</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activityLogs.map((log) => (
                            <TableRow key={log.id} className="animate-fade-in border-border">
                              <TableCell className="text-sm">
                                {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                              </TableCell>
                              <TableCell className="font-medium">{log.admin_username}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{getActionLabel(log.action_type)}</Badge>
                              </TableCell>
                              <TableCell>{getTargetLabel(log.target_type)}</TableCell>
                              <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                                {log.details ? JSON.stringify(log.details) : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>

          {/* Edit Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>تعديل مفتاح التنشيط</DialogTitle>
                <DialogDescription>تعديل بيانات المفتاح</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>مفتاح التنشيط</Label>
                  <Input
                    value={editKeyValue}
                    onChange={(e) => setEditKeyValue(e.target.value.toUpperCase())}
                    placeholder="أدخل مفتاح التنشيط الجديد"
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>اسم المستخدم</Label>
                  <Input
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="أدخل اسم المستخدم الجديد"
                    className="bg-background border-border"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>كلمة المرور الجديدة (اتركه فارغاً للإبقاء على القديمة)</Label>
                  <Input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الجديدة"
                    className="bg-background border-border"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>تاريخ الانتهاء</Label>
                  <Input
                    type="date"
                    value={editExpiresAt}
                    onChange={(e) => setEditExpiresAt(e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleEditKey} className="gradient-primary text-primary-foreground">حفظ التغييرات</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog for Firebase Keys */}
          <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>تعديل مفتاح التنشيط</DialogTitle>
                <DialogDescription>
                  تعديل بيانات المفتاح: {selectedFirebaseKey?.key}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>اسم المستخدم</Label>
                  <Input
                    value={firebaseKeyUsername}
                    onChange={(e) => setFirebaseKeyUsername(e.target.value)}
                    placeholder="أدخل اسم المستخدم"
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>كلمة المرور (اتركه فارغاً للإبقاء على القديمة)</Label>
                  <Input
                    type="password"
                    value={firebaseKeyPassword}
                    onChange={(e) => setFirebaseKeyPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الجديدة"
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>تاريخ الانتهاء</Label>
                  <Input
                    type="date"
                    value={firebaseKeyExpiresAt}
                    onChange={(e) => setFirebaseKeyExpiresAt(e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setPasswordDialogOpen(false); setIsEditingPassword(false); setFirebaseKeyExpiresAt(''); }}>
                  إلغاء
                </Button>
                <Button onClick={handleAddOrEditPasswordToFirebaseKey} className="gradient-primary text-primary-foreground">
                  حفظ
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteConfirmDialogOpen} onOpenChange={setDeleteConfirmDialogOpen}>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-destructive">تأكيد الحذف النهائي</DialogTitle>
                <DialogDescription>
                  سيتم حذف المفتاح نهائياً ولا يمكن استعادته. أدخل الرمز 780 للتأكيد.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm font-medium">المفتاح: {keyToDelete?.key_value}</p>
                  <p className="text-sm text-muted-foreground">المستخدم: {keyToDelete?.username}</p>
                </div>
                <div className="space-y-2">
                  <Label>رمز التأكيد</Label>
                  <Input
                    value={deleteConfirmCode}
                    onChange={(e) => setDeleteConfirmCode(e.target.value)}
                    placeholder="أدخل الرمز 780"
                    className="bg-background border-border"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDeleteConfirmDialogOpen(false); setDeleteConfirmCode(''); setKeyToDelete(null); }}>
                  إلغاء
                </Button>
                <Button variant="destructive" onClick={handlePermanentDelete}>
                  حذف نهائي
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;