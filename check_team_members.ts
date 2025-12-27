import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
        envVars[key.trim()] = valueParts.join('=').trim();
    }
});

const supabase = createClient(
    envVars['NEXT_PUBLIC_SUPABASE_URL'],
    envVars['SUPABASE_SERVICE_ROLE_KEY']
);

async function check() {
    // Get all teams
    const { data: teams, error: teamsError } = await supabase.from('teams').select('id, name');
    console.log('Teams:', JSON.stringify(teams, null, 2));

    // Get all team members
    const { data: members, error: membersError } = await supabase.from('team_members').select('id, team_id, first_name, last_name, email, user_id');
    console.log('\nTeam Members:', JSON.stringify(members, null, 2));

    // Count members per team
    if (teams && members) {
        for (const team of teams) {
            const teamMembers = members.filter(m => m.team_id === team.id);
            console.log(`\n${team.name}: ${teamMembers.length} members`);
            teamMembers.forEach(m => console.log(`  - ${m.first_name} ${m.last_name} (${m.email}) [user_id: ${m.user_id}]`));
        }
    }
}
check();
