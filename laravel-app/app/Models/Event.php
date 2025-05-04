<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'title',
        'description',
        'event_type',
        'event_level',
        'start_date',
        'end_date',
        'location',
        'address',
        'city',
        'country',
        'status',
        'capacity',
        'registration_deadline',
        'banner_image',
        'credits',
        'created_by_id',
        'is_featured',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'registration_deadline' => 'datetime',
        'capacity' => 'integer',
        'credits' => 'float',
        'is_featured' => 'boolean',
    ];

    /**
     * Get the user who created this event.
     */
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    /**
     * Get the schedules for this event.
     */
    public function schedules()
    {
        return $this->hasMany(EventSchedule::class);
    }

    /**
     * Get the speakers for this event.
     */
    public function speakers()
    {
        return $this->hasMany(EventSpeaker::class);
    }

    /**
     * Get the registrations for this event.
     */
    public function registrations()
    {
        return $this->hasMany(EventRegistration::class);
    }

    /**
     * Get the users registered for this event.
     */
    public function registeredUsers()
    {
        return $this->belongsToMany(User::class, 'event_registrations')
            ->withPivot(['status', 'attendance_confirmed', 'notes'])
            ->withTimestamps();
    }

    /**
     * Get the documents for this event.
     */
    public function documents()
    {
        return $this->hasMany(EventDocument::class);
    }

    /**
     * Get certificates issued for this event.
     */
    public function certificates()
    {
        return $this->hasMany(Certificate::class);
    }

    /**
     * Scope a query to only include events of a specific type.
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('event_type', $type);
    }

    /**
     * Scope a query to only include events of a specific status.
     */
    public function scopeOfStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope a query to only include events of a specific level.
     */
    public function scopeOfLevel($query, $level)
    {
        return $query->where('event_level', $level);
    }

    /**
     * Scope a query to only include upcoming events.
     */
    public function scopeUpcoming($query)
    {
        return $query->where('start_date', '>', now());
    }

    /**
     * Scope a query to only include past events.
     */
    public function scopePast($query)
    {
        return $query->where('end_date', '<', now());
    }

    /**
     * Scope a query to only include current events.
     */
    public function scopeCurrent($query)
    {
        return $query->where('start_date', '<=', now())
            ->where('end_date', '>=', now());
    }

    /**
     * Scope a query to only include featured events.
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }
}