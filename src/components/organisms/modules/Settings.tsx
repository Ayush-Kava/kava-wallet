'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { User, Mail, Shield, Loader2, Download, FileText } from 'lucide-react';
import { useSummaryTransactions } from '@/hooks/useSummaryTransactions';
import { authApi } from '@/services/api/auth';
import { format } from 'date-fns';
const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { transactions } = useSummaryTransactions();
  const [isUpdating, setIsUpdating] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');

  const getInitials = () => {
    if (fullName) {
      return fullName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const data = await authApi.updateProfile(fullName);
      if (data?.user) {
        setFullName(data.user.full_name || '');
      }

      toast({ title: 'Profile updated successfully!' });
    } catch (error: any) {
      toast({
        title: 'Error updating profile',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast({ title: 'No transactions to export', variant: 'destructive' });
      return;
    }

    const headers = ['Date', 'Type', 'Category', 'Account', 'Description', 'Amount'];
    const rows = transactions.map(t => [
      format(new Date(t.date), 'yyyy-MM-dd'),
      t.type,
      t.categories?.name || 'Uncategorized',
      t.accounts?.name || 'Unknown',
      t.description || '',
      t.type === 'expense' ? `-${t.amount}` : t.amount,
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kavaflow-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast({ title: 'Transactions exported successfully!' });
  };

  return (
    <DashboardLayout title="Settings" description="Manage your account and preferences">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Profile Card */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <User size={20} /> Profile
            </CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="gradient-primary text-xl font-semibold text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">{fullName || 'Your Name'}</p>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="animate-spin" /> : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Export Data */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Download size={20} /> Export Data
            </CardTitle>
            <CardDescription>Download your transaction history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button variant="outline" onClick={handleExportCSV}>
                <FileText size={18} /> Export as CSV
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Export all your transactions for backup or analysis in spreadsheet applications.
            </p>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Shield size={20} /> Security
            </CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <Mail className="text-primary" size={20} />
                <div>
                  <p className="font-medium">Email Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Your account is secured with email and password
                  </p>
                </div>
              </div>
            </div>

            <Button variant="destructive" onClick={signOut} className="w-full sm:w-auto">
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="py-4 text-center text-sm text-muted-foreground">
          <p>KavaFlow v1.0.0</p>
          <p>© 2024 Kava Group of Companies. All rights reserved.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
