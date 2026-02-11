const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pzsvbqfzacidkeqavgfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6c3ZicWZ6YWNpZGtlcWF2Z2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MzY0MDEsImV4cCI6MjA4NjExMjQwMX0.QhFiGA4rBbHnVVXnplEBSVJ2KZL4kt07Ko_h6afbDSY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("Checking guild_data...");
    const { data: guildData, error: guildError } = await supabase.from('guild_data').select('*').limit(1);
    if (guildError) console.error('Error fetching guild_data:', guildError);
    else if (guildData.length > 0) console.log('guild_data sample:', guildData[0]);
    else console.log('guild_data table exists but is empty');

    console.log("Checking tm.tourney...");
    const { data: tourneyData, error: tourneyError } = await supabase.from('tm.tourney').select('*').limit(1);
    if (tourneyError) console.error('Error fetching tm.tourney:', tourneyError);
    else if (tourneyData.length > 0) console.log('tm.tourney sample:', tourneyData[0]);
}

inspect();
