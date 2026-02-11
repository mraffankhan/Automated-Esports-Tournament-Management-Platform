const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pzsvbqfzacidkeqavgfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6c3ZicWZ6YWNpZGtlcWF2Z2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MzY0MDEsImV4cCI6MjA4NjExMjQwMX0.QhFiGA4rBbHnVVXnplEBSVJ2KZL4kt07Ko_h6afbDSY';

// Configure client to use 'tm' schema
const supabase = createClient(supabaseUrl, supabaseKey, { db: { schema: 'tm' } });

async function inspect() {
    console.log("Checking 'team' in 'tm' schema...");
    const { data: teamData, error: teamError } = await supabase.from('team').select('*').limit(1);
    if (teamError) console.log('Error fetching team:', teamError);
    else console.log('Found team:', teamData);

    console.log("Checking 'tournament_team' in 'tm' schema...");
    const { data: ttData, error: ttError } = await supabase.from('tournament_team').select('*').limit(1);
    if (ttError) console.log('Error fetching tournament_team:', ttError);
    else console.log('Found tournament_team:', ttData);

    console.log("Checking 'registration' in 'tm' schema...");
    const { data: regData, error: regError } = await supabase.from('registration').select('*').limit(1);
    if (regError) console.log('Error fetching registration:', regError);
    else console.log('Found registration:', regData);

    // Also try 'public' schema explicitly for comparison if needed
}

inspect();
