-- Test Chat Setup Script
-- Verify and fix user/team/project/channel relationships for testing

-- 1. Check if user 1 is a member of team 1
SELECT 'User 1 in Team 1:' as check_name, * FROM team_members WHERE team_id = 1 AND user_id = 1;

-- 2. Check if user 1 is a member of project 1
SELECT 'User 1 in Project 1:' as check_name, * FROM project_members WHERE project_id = 1 AND user_id = 1;

-- 3. Check all channels for team 1
SELECT 'Channels in Team 1:' as check_name, id, name, type, project_id, team_id FROM channels WHERE team_id = 1;

-- 4. Check project 1 details
SELECT 'Project 1:' as check_name, * FROM projects WHERE id = 1;

-- ===== FIX COMMANDS (uncomment to execute) =====

-- If user 1 is NOT in team 1, add them:
-- INSERT INTO team_members (team_id, user_id, role) 
-- VALUES (1, 1, 'owner')
-- ON CONFLICT (team_id, user_id) DO NOTHING;

-- If user 1 is NOT in project 1, add them:
-- INSERT INTO project_members (project_id, user_id, role) 
-- VALUES (1, 1, 'lead')
-- ON CONFLICT (project_id, user_id) DO NOTHING;

-- Create a general team channel if none exists:
-- INSERT INTO channels (team_id, project_id, name, type, is_private)
-- VALUES (1, NULL, 'general', 'text', false)
-- ON CONFLICT (team_id, name) DO NOTHING;

-- Test query to see what channels user 1 should see:
SELECT 
  c.id,
  c.name,
  c.type,
  c.project_id,
  c.is_private,
  c.created_at,
  p.name AS project_name,
  CASE 
    WHEN c.project_id IS NULL THEN 'Team Channel'
    WHEN EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = c.project_id AND pm.user_id = 1) THEN 'Has Project Access'
    ELSE 'No Project Access'
  END as access_status
FROM channels c
LEFT JOIN projects p ON c.project_id = p.id
WHERE c.team_id = 1
ORDER BY c.project_id NULLS FIRST, c.name ASC;
