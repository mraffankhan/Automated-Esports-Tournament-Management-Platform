const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pzsvbqfzacidkeqavgfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6c3ZicWZ6YWNpZGtlcWF2Z2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MzY0MDEsImV4cCI6MjA4NjExMjQwMX0.QhFiGA4rBbHnVVXnplEBSVJ2KZL4kt07Ko_h6afbDSY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("Checking team counts...");

    // Attempt to fetch tourneys with count of registrations
    // Relation key in join table is "tm.tourney_id"
    // We need to see if we can reference 'tm.tourney_tm.register' from 'tm.tourney'

    const { data: tourneyData, error: tourneyError } = await supabase
        .from('tm.tourney')
        .select(`
            id,
            name,
            registrations: "tm.tourney_tm.register" (count)
        `)
        .limit(5);

    if (tourneyError) {
        console.log('Error fetching counts:', tourneyError.message);
        console.log('Hint:', tourneyError.hint);
    } else {
        console.log('Tourney Data with Count:', JSON.stringify(tourneyData, null, 2));
    }
}

inspect();
