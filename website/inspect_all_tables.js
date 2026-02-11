const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pzsvbqfzacidkeqavgfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6c3ZicWZ6YWNpZGtlcWF2Z2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MzY0MDEsImV4cCI6MjA4NjExMjQwMX0.QhFiGA4rBbHnVVXnplEBSVJ2KZL4kt07Ko_h6afbDSY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    // Try to blindly fetch from 'tourney' again to double check what worked before
    console.log("Checking 'tm.tourney' again...");
    const { data: tourneyData, error: tourneyError } = await supabase.from('tm.tourney').select('*').limit(1);
    if (!tourneyError) console.log('Found tm.tourney:', tourneyData.length);
    else console.log('Error fetching tm.tourney:', tourneyError.message);

    // Try 'tourney' without prefix
    console.log("Checking 'tourney'...");
    const { data: tData, error: tError } = await supabase.from('tourney').select('*').limit(1);
    if (!tError) console.log('Found tourney:', tData.length);
    else console.log('Error fetching tourney:', tError.message);

    // Maybe the table is literally named "tm.tourney" in public schema?
    // Let's try to query likely team tables with same pattern
    const tables = ['tm.team', 'tm.tournament_team', 'tm.player_team', 'tm.registration', 'team', 'tournament_team', 'player_team', 'registration'];

    for (const table of tables) {
        console.log(`Checking '${table}'...`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (!error) console.log(`FOUND ${table}:`, data);
        else console.log(`Error ${table}:`, error.message);
    }
}

inspect();
