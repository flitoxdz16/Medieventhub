<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventRegistration extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'event_id',
        'user_id',
        'status',
        'attendance_confirmed',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'attendance_confirmed' => 'boolean',
    ];

    /**
     * Get the event that owns the registration.
     */
    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Get the user that owns the registration.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the certificate associated with this registration.
     */
    public function certificate()
    {
        return $this->hasOne(Certificate::class);
    }

    /**
     * Scope a query to only include registrations with a specific status.
     */
    public function scopeOfStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope a query to only include registrations with confirmed attendance.
     */
    public function scopeAttendanceConfirmed($query)
    {
        return $query->where('attendance_confirmed', true);
    }
}