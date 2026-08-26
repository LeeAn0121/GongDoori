export async function syncGoogleCalendar(
  record: any,
  action: 'insert' | 'update' | 'delete',
  googleEventId?: string | null
): Promise<string | null> {
  const token = localStorage.getItem('google_provider_token');
  if (!token) return null; // No token, skip sync

  const baseUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    if (action === 'delete') {
      if (googleEventId) {
        await fetch(`${baseUrl}/${googleEventId}`, { method: 'DELETE', headers });
      }
      return null;
    }

    const event = {
      summary: `[공돌이] ${record.site_name}`,
      description: `단가: ${record.amount}원\n품수: ${record.poomsu}\n경비: ${record.expenses}원\n메모: ${record.memo || ''}`,
      start: {
        date: record.date, 
      },
      end: {
        // For all day events, end date is exclusive, so we add 1 day
        date: getNextDay(record.date), 
      },
    };

    if (action === 'update' && googleEventId) {
      const response = await fetch(`${baseUrl}/${googleEventId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(event),
      });
      if (response.ok) return googleEventId;
    } 
    
    // insert
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(event),
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.id;
    } else {
      console.error('Google Calendar API error:', await response.text());
      return null;
    }
  } catch (error) {
    console.error('Failed to sync with Google Calendar:', error);
    return null;
  }
}

function getNextDay(dateString: string): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}
