const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pzsvbqfzacidkeqavgfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6c3ZicWZ6YWNpZGtlcWF2Z2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MzY0MDEsImV4cCI6MjA4NjExMjQwMX0.QhFiGA4rBbHnVVXnplEBSVJ2KZL4kt07Ko_h6afbDSY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("Attempting join query...");
    // Try to select from join table and expand 'tm.register'
    // Note: relationship name usually matches table name, but here it has dots.
    // If foreign key is detected, it should work.
    // If not, we might need to rely on manual join? No, Supabase doesn't support manual join in client, only expanding relations.

    // Column name is "tm.tourney_id" (with quotes likely)
    const { data: joinData, error: joinError } = await supabase
        .from('tm.tourney_tm.register')
        .select(`
            "tm.tourney_id",
            tmslot_id,
            tm.register (*)
        `)
        .eq('"tm.tourney_id"', 1) // Assuming tourney ID 1 exists
        .limit(5);

    if (joinError) {
        console.log('Error fetching join:', joinError.message);
        console.log('Hint:', joinError.hint);
    } else {
        console.log('Join Data:', JSON.stringify(joinData, null, 2));
    }
}

inspect();
