const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pzsvbqfzacidkeqavgfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6c3ZicWZ6YWNpZGtlcWF2Z2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MzY0MDEsImV4cCI6MjA4NjExMjQwMX0.QhFiGA4rBbHnVVXnplEBSVJ2KZL4kt07Ko_h6afbDSY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    // Attempt to query information_schema or perform rpc if function exists
    // Since we don't know rpc, let's try to infer from what worked.
    // 'tm.tourney' worked.

    const tables = [
        'teams', 'tm.teams',
        'tournament_teams', 'tm.tournament_teams',
        'registrations', 'tm.registrations',
        'tm.participation', 'participation'
    ];

    for (const table of tables) {
        console.log(`Checking '${table}'...`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (!error) console.log(`FOUND ${table}:`, data);
        else console.log(`Error ${table}:`, error.message);
    }
}

inspect();
