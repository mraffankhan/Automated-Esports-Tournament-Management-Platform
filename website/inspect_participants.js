const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pzsvbqfzacidkeqavgfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6c3ZicWZ6YWNpZGtlcWF2Z2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MzY0MDEsImV4cCI6MjA4NjExMjQwMX0.QhFiGA4rBbHnVVXnplEBSVJ2KZL4kt07Ko_h6afbDSY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("Checking 'tm.participant'...");
    const { data: partData, error: partError } = await supabase.from('tm.participant').select('*').limit(1);
    if (partData && partData.length > 0) console.log('tm.participant keys:', Object.keys(partData[0])); else console.log('tm.participant empty or error', partError);

    console.log("Checking 'tm.player'...");
    const { data: playerData, error: playerError } = await supabase.from('tm.player').select('*').limit(1);
    if (playerData && playerData.length > 0) console.log('tm.player keys:', Object.keys(playerData[0])); else console.log('tm.player empty or error', playerError);

    // Check if tm.participant has tournament_id
    if (partData && partData.length > 0) {
        console.log('Sample Participant:', partData[0]);
    }
}

inspect();
