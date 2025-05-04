<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventSpeaker extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'event_id',
        'name',
        'title',
        'organization',
        'bio',
        'photo',
        'email',
        'phone',
        'social_links',
        'user_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'social_links' => 'json',
    ];

    /**
     * Get the event that owns the speaker.
     */
    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Get the user associated with this speaker.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the schedule items for this speaker.
     */
    public function scheduleItems()
    {
        return $this->hasMany(EventSchedule::class, 'speaker_id');
    }
}