const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pzsvbqfzacidkeqavgfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6c3ZicWZ6YWNpZGtlcWF2Z2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MzY0MDEsImV4cCI6MjA4NjExMjQwMX0.QhFiGA4rBbHnVVXnplEBSVJ2KZL4kt07Ko_h6afbDSY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("Checking tm.team...");
    const { data: teamData, error: teamError } = await supabase.from('tm.team').select('*').limit(1);
    if (teamError) console.error('Error fetching tm.team:', teamError);
    else console.log('tm.team sample:', teamData);

    console.log("Checking tm.tournament_team...");
    const { data: ttData, error: ttError } = await supabase.from('tm.tournament_team').select('*').limit(1);
    if (ttError) console.error('Error fetching tm.tournament_team:', ttError);
    else console.log('tm.tournament_team sample:', ttData);

    console.log("Checking tm.registration...");
    const { data: regData, error: regError } = await supabase.from('tm.registration').select('*').limit(1);
    if (regError) console.error('Error fetching tm.registration:', regError);
    else console.log('tm.registration sample:', regData);
}

inspect();
