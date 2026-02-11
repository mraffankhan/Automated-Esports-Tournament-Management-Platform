const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pzsvbqfzacidkeqavgfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6c3ZicWZ6YWNpZGtlcWF2Z2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MzY0MDEsImV4cCI6MjA4NjExMjQwMX0.QhFiGA4rBbHnVVXnplEBSVJ2KZL4kt07Ko_h6afbDSY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    // Try to list schemas/tables via RPC if possible, or just raw fetch from common names
    // Supabase JS client defaults to public schema. We need to specify schema maybe?

    // Let's try to query likely table names without 'tm.' prefix, maybe they are in public?
    console.log("Checking 'team'...");
    const { data: teamData, error: teamError } = await supabase.from('team').select('*').limit(1);
    if (!teamError) console.log('Found team in public:', teamData);
    else console.log('Not in public "team":', teamError.message);

    console.log("Checking 'tournament_team'...");
    const { data: ttData, error: ttError } = await supabase.from('tournament_team').select('*').limit(1);
    if (!ttError) console.log('Found tournament_team in public:', ttData);
    else console.log('Not in public "tournament_team":', ttError.message);

    console.log("Checking 'registration'...");
    const { data: regData, error: regError } = await supabase.from('registration').select('*').limit(1);
    if (!regError) console.log('Found registration in public:', regData);
    else console.log('Not in public "registration":', regError.message);

    // Try specifying schema explicitly in client creation?
    // Or just try query again with correct syntax if earlier one failed.
    // The earlier error "Could not find the table 'public.tm.team'" suggests it treated 'tm.team' as the table name inside public schema.
    // To query a different schema, we might need to change search_path or use a different client config.
    // BUT `tm.tourney` worked with `supabase.from("tm.tourney")` in the page.tsx! 
    // Wait, did it? 
    // Let's check page.tsx again.
}

inspect();
