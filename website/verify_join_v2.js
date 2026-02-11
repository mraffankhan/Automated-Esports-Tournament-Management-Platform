const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pzsvbqfzacidkeqavgfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6c3ZicWZ6YWNpZGtlcWF2Z2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MzY0MDEsImV4cCI6MjA4NjExMjQwMX0.QhFiGA4rBbHnVVXnplEBSVJ2KZL4kt07Ko_h6afbDSY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("Attempting join query with quotes...");
    const { data: joinData, error: joinError } = await supabase
        .from('tm.tourney_tm.register')
        .select(`
            "tm.tourney_id",
            tmslot_id,
           "tm.register" (*)
        `)
        // Note: sometimes relation name is different from table name if FK is named differently
        // But usually it matches table name.
        .eq('"tm.tourney_id"', 1)
        .limit(5);

    if (joinError) {
        console.log('Error fetching join:', joinError.message);
        console.log('Hint:', joinError.hint);

        // If join fails, let's verify fetching from join table works
        console.log("Fallback: Fetching raw join table...");
        const { data, error } = await supabase.from('tm.tourney_tm.register').select('*').limit(5);
        if (error) console.log("Raw fetch error:", error.message);
        else console.log("Raw Data:", data);
    } else {
        console.log('Join Data:', JSON.stringify(joinData, null, 2));
    }
}

inspect();
