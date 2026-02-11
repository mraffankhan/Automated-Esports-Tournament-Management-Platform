const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pzsvbqfzacidkeqavgfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6c3ZicWZ6YWNpZGtlcWF2Z2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MzY0MDEsImV4cCI6MjA4NjExMjQwMX0.QhFiGA4rBbHnVVXnplEBSVJ2KZL4kt07Ko_h6afbDSY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("Checking 'tm.register'...");
    const { data: slotData, error: slotError } = await supabase.from('tm.register').select('*').limit(1);
    if (slotError) console.log('Error fetching tm.register:', slotError.message);
    else console.log('tm.register sample:', slotData);

    console.log("Checking 'tm.tourney_tm.register'...");
    const { data: joinData, error: joinError } = await supabase.from('tm.tourney_tm.register').select('*').limit(1);

    if (joinError) {
        console.log('Error fetching tm.tourney_tm.register:', joinError.message);
        // Try without quotes or with different casing if failed
        const alternateNames = ['tourney_register', 'tm_tourney_tm_register', 'tm.tourney_tm_register'];
        for (const name of alternateNames) {
            const { data, error } = await supabase.from(name).select('*').limit(1);
            if (!error) console.log(`Found ${name}:`, data);
        }
    }
    else {
        console.log('tm.tourney_tm.register sample:', joinData);
    }
}

inspect();
