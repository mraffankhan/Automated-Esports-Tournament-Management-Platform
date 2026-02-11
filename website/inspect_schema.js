const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '.env.local');
        if (!fs.existsSync(envPath)) return;
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
        });
    } catch (e) { console.error(e); }
}
loadEnv();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspect() {
    // Check guild_data columns
    const { data: guildData, error: guildError } = await supabase.from('guild_data').select('*').limit(1);
    if (guildError) console.error('Error fetching guild_data:', guildError);
    else if (guildData.length > 0) console.log('guild_data sample:', guildData[0]);
    else console.log('guild_data table exists but is empty');

    // Check tm.tourney columns
    const { data: tourneyData, error: tourneyError } = await supabase.from('tm.tourney').select('*').limit(1);
    if (tourneyError) console.error('Error fetching tm.tourney:', tourneyError);
    else if (tourneyData.length > 0) console.log('tm.tourney sample:', tourneyData[0]);
}

inspect();
