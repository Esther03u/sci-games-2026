// tests/ceremony-route.test.js
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('ceremony page and navigation', () => {
  it('creates the /admin/ceremony route file', () => {
    const routeJs = path.resolve(process.cwd(), 'src/app/(admin)/admin/ceremony/page.js');
    const routeJsx = path.resolve(process.cwd(), 'src/app/(admin)/admin/ceremony/page.jsx');
    expect(fs.existsSync(routeJs) || fs.existsSync(routeJsx)).toBe(true);
  });

  it('links ceremony in AdminSidebar.js', () => {
    const sidebarPath = path.resolve(process.cwd(), 'src/components/admin/AdminSidebar.js');
    const content = fs.readFileSync(sidebarPath, 'utf8');
    expect(content).toContain('/admin/ceremony');
  });

  it('links ceremony in Admin dashboard page.js', () => {
    const dashboardPath = path.resolve(process.cwd(), 'src/app/(admin)/admin/page.js');
    const content = fs.readFileSync(dashboardPath, 'utf8');
    expect(content).toContain('/admin/ceremony');
  });
});
