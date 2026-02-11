const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pzsvbqfzacidkeqavgfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6c3ZicWZ6YWNpZGtlcWF2Z2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MzY0MDEsImV4cCI6MjA4NjExMjQwMX0.QhFiGA4rBbHnVVXnplEBSVJ2KZL4kt07Ko_h6afbDSY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("Checking 'tm.participant' count...");
    const { count, error: countError } = await supabase.from('tm.participant').select('*', { count: 'exact', head: true });

    if (countError) {
        console.log('Error counting tm.participant:', countError);
    } else {
        console.log('tm.participant count:', count);
        // Try fetch if count > 0
        if (count > 0 || count === 0) {
            const { data, error } = await supabase.from('tm.participant').select('*').limit(1);
            if (error) console.log('Error fetching row:', error);
            else console.log('Row:', data);
        }
    }

    console.log("Checking 'tm.registration'...");
    const { data: regData, error: regError } = await supabase.from('tm.registration').select('*').limit(1);
    if (regError) console.log('Error fetching tm.registration:', regError.message);
    else console.log('tm.registration row:', regData);
}

inspect();
