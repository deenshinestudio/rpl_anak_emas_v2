import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

serve(async (req: Request) => {
  try {
    // 1. Inisialisasi Supabase Client (bisa bypass RLS karena ini server)
    // @ts-ignore: Deno namespace exists in Supabase Edge Functions
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    // @ts-ignore: Deno namespace exists in Supabase Edge Functions
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 2. Set Up Web Push dengan VAPID Keys dari Environment
    // @ts-ignore: Deno namespace exists in Supabase Edge Functions
    const publicVapidKey = Deno.env.get('VAPID_PUBLIC_KEY')
    // @ts-ignore: Deno namespace exists in Supabase Edge Functions
    const privateVapidKey = Deno.env.get('VAPID_PRIVATE_KEY')

    if (!publicVapidKey || !privateVapidKey) {
        throw new Error('VAPID keys not configured in environment');
    }

    // Email admin untuk identifikasi
    webpush.setVapidDetails('mailto:admin@rplanakemas.com', publicVapidKey, privateVapidKey)

    // 3. Waktu sekarang dan batasan
    const now = new Date()
    // 4. Ambil semua tugas yang 'pending'
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*, users(nim)')
      .eq('status', 'pending')

    if (tasksError) throw tasksError;

    let sentCount = 0;

    for (const task of tasks ?? []) {
      const deadline = new Date(task.deadline);
      // Set deadline ke penghujung hari 23:59:59 (sesuai UI)
      deadline.setHours(23, 59, 59, 999);
      
      const diffTime = deadline.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let urgency = null;

      // Logika Penentuan Urgency terbaru: H-3, H-2, H-1
      if (diffDays === 1) {
        urgency = 'MENDESAK (H-1)';
      } else if (diffDays === 2) {
        urgency = 'PERINGATAN (H-2)';
      } else if (diffDays === 3) {
        urgency = 'PENGINGAT AWAL (H-3)';
      } else if (diffTime < 0) {
        urgency = 'TERLEWAT';
      }

      // Jika tugas membutuhkan notifikasi
      if (urgency) {
        // Ambil data push_subscriptions milik user dari tugas tersebut
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('subscription')
          .eq('user_nim', task.user_nim)

        for (const row of subs ?? []) {
          const payload = JSON.stringify({
            title: `[${urgency}] ${task.matkul}`,
            body: `Tugas "${task.judul}" deadline pada ${deadline.toLocaleDateString('id-ID')}. Ayo kerjakan!`,
            tag: `task-${task.id}`, // Tag memastikan notif task yang sama tidak menumpuk
            url: '/'
          })

          try {
            await webpush.sendNotification(row.subscription, payload);
            sentCount++;
          } catch (pushErr: any) {
            console.error(`Gagal mengirim push ke user ${task.user_nim}:`, pushErr);
            // Optional: Jika err statusCode === 410 (Gone), delete subscription dari DB
            if (pushErr.statusCode === 410) {
                 await supabase.from('push_subscriptions').delete().eq('subscription', row.subscription);
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, sent: sentCount }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
