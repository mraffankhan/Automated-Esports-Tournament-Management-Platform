const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pzsvbqfzacidkeqavgfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6c3ZicWZ6YWNpZGtlcWF2Z2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MzY0MDEsImV4cCI6MjA4NjExMjQwMX0.QhFiGA4rBbHnVVXnplEBSVJ2KZL4kt07Ko_h6afbDSY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    // 1. Check tm.tourney columns for any hints
    console.log("Checking 'tm.tourney' structure...");
    const { data: tourneyData, error: tourneyError } = await supabase.from('tm.tourney').select('*').limit(1);
    if (tourneyData && tourneyData.length > 0) {
        console.log('tm.tourney keys:', Object.keys(tourneyData[0]));
    }

    // 2. Try more table names
    const tables = ['tm.participant', 'tm.user', 'tm.player', 'tm.roster', 'tm.squad', 'tm.entry'];
    for (const table of tables) {
        console.log(`Checking '${table}'...`);
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (!error) console.log(`FOUND ${table}!`);
    }
}

inspect();
