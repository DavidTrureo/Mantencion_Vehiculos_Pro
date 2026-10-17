package com.mantenimiento.vehiculospro_api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class NhtsaMakeResponse {
    @JsonProperty("Count")
    private int count;
    @JsonProperty("Message")
    private String message;
    @JsonProperty("Results")
    private List<NhtsaMake> results;

    public int getCount() { return count; }
    public void setCount(int count) { this.count = count; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public List<NhtsaMake> getResults() { return results; }
    public void setResults(List<NhtsaMake> results) { this.results = results; }

    public static class NhtsaMake {
        @JsonProperty("MakeId")
        private int makeId;
        @JsonProperty("MakeName")
        private String makeName;

        public int getMakeId() { return makeId; }
        public void setMakeId(int makeId) { this.makeId = makeId; }

        public String getMakeName() { return makeName; }
        public void setMakeName(String makeName) { this.makeName = makeName; }
    }
}
